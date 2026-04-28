const sql = require('mssql');
const { getPool } = require('../../config/database');
const flowInstance = require('./flowInstance');
const flowDefinition = require('./flowDefinition');
const eventPublisher = require('../eventPublisher');

const APPROVAL_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  TRANSFER: 'transfer',
  ADD_SIGN: 'add_sign',
  CONSULT: 'consult'
};

async function approve(recordId, operator, comment = '') {
  return processApproval(recordId, APPROVAL_ACTIONS.APPROVE, operator, comment);
}

async function reject(recordId, operator, comment = '') {
  return processApproval(recordId, APPROVAL_ACTIONS.REJECT, operator, comment);
}

async function processApproval(recordId, action, operator, comment = '') {
  const record = await flowInstance.getNodeRecord(recordId);
  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.assignee_id !== operator.userId) {
    const hasPermission = await checkApprovalPermission(operator, record);
    if (!hasPermission) {
      throw new Error('You do not have permission to process this approval');
    }
  }

  if (record.status !== 'pending') {
    throw new Error(`Record has already been processed: ${record.status}`);
  }

  const pool = await getPool();
  const newStatus = action === APPROVAL_ACTIONS.APPROVE ? 'approved' : 'rejected';

  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('finished_at', sql.DateTime, new Date())
    .input('action', sql.NVarChar, action)
    .input('comment', sql.NVarChar, comment)
    .input('status', sql.NVarChar, newStatus)
    .query(`
      UPDATE dbo.wf_instance_node
      SET status = @status,
          finished_at = @finished_at,
          action = @action,
          comment = @comment
      WHERE record_id = @record_id
    `);

  await flowInstance.addApprovalHistory(record.instance_id, recordId, operator, action, comment);

  await updateTodoStatus(recordId, newStatus);

  const instance = await flowInstance.getInstanceById(record.instance_id);
  const flow = await flowDefinition.getFlowById(instance.flow_id);
  const nodes = flow.current_config.nodes || [];
  const currentNode = nodes.find(n => n.node_code === record.node_code);

  if (action === APPROVAL_ACTIONS.REJECT) {
    await flowInstance.addRunLog(record.instance_id, null, 'warn', record.node_code, `Rejected by ${operator.userName}`);
    await terminateInstanceFlow(record.instance_id, operator, 'rejected');
    return { success: false, action, instance: await flowInstance.getInstanceById(record.instance_id) };
  }

  await flowInstance.addRunLog(record.instance_id, null, 'info', record.node_code, `Approved by ${operator.userName}`);

  const approvalRule = currentNode?.rules?.find(r => r.rule_type === 'approval_type');
  const isSequential = approvalRule?.rule_value === 'sequence';

  if (isSequential) {
    await handleSequentialApproval(record, operator, flow, nodes);
  } else {
    await handleParallelApproval(record, instance, flow, nodes);
  }

  await eventPublisher.publish('wf.approval.' + action, {
    instance_id: record.instance_id,
    record_id: recordId,
    node_code: record.node_code,
    operator: operator,
    comment: comment
  }, operator);

  return {
    success: true,
    action,
    instance: await flowInstance.getInstanceById(record.instance_id),
    next_nodes: await getNextNodesInfo(record.instance_id)
  };
}

async function handleSequentialApproval(currentRecord, operator, flow, nodes) {
  const currentNode = nodes.find(n => n.node_code === currentRecord.node_code);
  const nextNodeCodes = currentNode?.next_node_ids?.split(',').map(id => id.trim()) || [];

  for (const nextCode of nextNodeCodes) {
    const nextNode = nodes.find(n => n.node_code === nextCode);
    if (nextNode) {
      await flowInstance.moveToNextNode(currentRecord.instance_id, nextNode, operator);
      break;
    }
  }
}

async function handleParallelApproval(currentRecord, instance, flow, nodes) {
  const pendingRecords = await getPendingParallelRecords(instance.instance_id, currentRecord.node_code);

  if (pendingRecords.length > 0) {
    console.log(`[Approval] Waiting for ${pendingRecords.length} parallel approvals`);
    return;
  }

  const currentNode = nodes.find(n => n.node_code === currentRecord.node_code);
  await flowInstance.moveToNextNode(instance.instance_id, currentNode, {});
}

async function getPendingParallelRecords(instanceId, nodeCode) {
  const pool = await getPool();
  const result = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('node_code', sql.NVarChar, nodeCode)
    .query(`
      SELECT * FROM dbo.wf_instance_node
      WHERE instance_id = @instance_id AND node_code = @node_code AND status = 'pending'
    `);
  return result.recordset;
}

async function checkApprovalPermission(operator, record) {
  if (operator.isAdmin) return true;

  const pool = await getPool();
  const userResult = await pool.request()
    .input('user_id', sql.Int, operator.userId)
    .query(`SELECT role_id FROM dbo.sys_user_roles WHERE user_id = @user_id`);
  const userRoles = userResult.recordset.map(r => r.role_id);

  if (userRoles.length === 0) return false;

  return true;
}

async function updateTodoStatus(recordId, status) {
  await flowInstance.ensureTables();
  const pool = await getPool();
  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('status', sql.NVarChar, status)
    .input('updated_at', sql.DateTime, new Date())
    .query(`
      UPDATE dbo.wf_todo
      SET status = @status, updated_at = @updated_at
      WHERE record_id = @record_id
    `);
}

async function terminateInstanceFlow(instanceId, operator, reason) {
  await flowInstance.ensureTables();
  const pool = await getPool();

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('end_at', sql.DateTime, new Date())
    .input('status', sql.NVarChar, reason === 'rejected' ? 'rejected' : 'terminated')
    .query(`
      UPDATE dbo.wf_instance
      SET status = @status, end_at = @end_at
      WHERE instance_id = @instance_id
    `);

  await flowInstance.addRunLog(instanceId, null, 'warn', null, `Flow terminated: ${reason}`);

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('status', sql.NVarChar, 'cancelled')
    .query(`
      UPDATE dbo.wf_todo
      SET status = @status
      WHERE instance_id = @instance_id AND status = 'pending'
    `);

  await eventPublisher.publish('wf.instance.terminated', {
    instance_id: instanceId,
    reason: reason,
    operator: operator
  }, operator);
}

async function getNextNodesInfo(instanceId) {
  const instance = await flowInstance.getInstanceById(instanceId);
  if (!instance) return null;

  const pendingRecords = await getPendingRecords(instanceId);

  return pendingRecords.map(r => ({
    record_id: r.record_id,
    node_code: r.node_code,
    node_type: r.node_type,
    assignee_id: r.assignee_id,
    assignee_name: r.assignee_name,
    status: r.status
  }));
}

async function getPendingRecords(instanceId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT * FROM dbo.wf_instance_node
      WHERE instance_id = @instance_id AND status = 'pending'
      ORDER BY record_id
    `);
  return result.recordset;
}

async function transferApproval(recordId, toUserId, toUserName, operator, comment = '') {
  const record = await flowInstance.getNodeRecord(recordId);
  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.assignee_id !== operator.userId) {
    throw new Error('Only the current assignee can transfer this approval');
  }

  const pool = await getPool();
  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('assignee_id', sql.Int, toUserId)
    .input('assignee_name', sql.NVarChar, toUserName)
    .input('assigned_at', sql.DateTime, new Date())
    .query(`
      UPDATE dbo.wf_instance_node
      SET assignee_id = @assignee_id,
          assignee_name = @assignee_name,
          assigned_at = @assigned_at
      WHERE record_id = @record_id
    `);

  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('status', sql.NVarChar, 'transferred')
    .input('updated_at', sql.DateTime, new Date())
    .query(`
      UPDATE dbo.wf_todo
      SET status = @status, updated_at = @updated_at
      WHERE record_id = @record_id
    `);

  await flowInstance.createTodo(record.instance_id, recordId, toUserId, toUserName, record.node_code);

  await flowInstance.addApprovalHistory(record.instance_id, recordId, operator, 'transfer', `Transferred to ${toUserName}: ${comment}`);

  await flowInstance.addRunLog(record.instance_id, null, 'info', record.node_code, `Transferred from ${operator.userName} to ${toUserName}`);

  await eventPublisher.publish('wf.approval.transfer', {
    instance_id: record.instance_id,
    record_id: recordId,
    from_user: operator,
    to_user: { userId: toUserId, userName: toUserName },
    comment: comment
  }, operator);

  return { success: true };
}

async function getApprovalHistory(instanceId) {
  await flowInstance.ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT wah.*, su.name as operator_name
      FROM dbo.wf_approval_history wah
      LEFT JOIN dbo.sys_users su ON wah.operator_id = su.id
      WHERE wah.instance_id = @instance_id
      ORDER BY wah.operate_at ASC
    `);
  return result.recordset;
}

async function getApprovalDetail(recordId) {
  await flowInstance.ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('record_id', sql.Int, recordId)
    .query(`
      SELECT win.*, wi.biz_id, wi.biz_data, wfd.flow_name
      FROM dbo.wf_instance_node win
      JOIN dbo.wf_instance wi ON win.instance_id = wi.instance_id
      JOIN dbo.wf_flow_definition wfd ON wi.flow_id = wfd.flow_id
      WHERE win.record_id = @record_id
    `);

  if (result.recordset.length === 0) return null;

  const detail = result.recordset[0];
  detail.biz_data = JSON.parse(detail.biz_data || '{}');

  const historyResult = await pool.request()
    .input('record_id', sql.Int, recordId)
    .query(`
      SELECT * FROM dbo.wf_approval_history
      WHERE record_id = @record_id
      ORDER BY operate_at ASC
    `);
  detail.history = historyResult.recordset;

  return detail;
}

async function consult(recordId, consultUserId, consultUserName, comment, operator) {
  const record = await flowInstance.getNodeRecord(recordId);
  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  await flowInstance.createTodo(record.instance_id, recordId, consultUserId, consultUserName, record.node_code);

  await flowInstance.addApprovalHistory(record.instance_id, recordId, operator, 'consult', `Consulted ${consultUserName}: ${comment}`);

  await flowInstance.addRunLog(record.instance_id, null, 'info', record.node_code, `Consult request sent to ${consultUserName}`);

  return { success: true };
}

async function addSign(recordId, signUserId, signUserName, operator, comment) {
  const record = await flowInstance.getNodeRecord(recordId);
  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  const pool = await getPool();
  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('assignee_id', sql.Int, signUserId)
    .input('assignee_name', sql.NVarChar, signUserName)
    .input('assigned_at', sql.DateTime, new Date())
    .input('status', sql.NVarChar, 'pending')
    .query(`
      UPDATE dbo.wf_instance_node
      SET assignee_id = @assignee_id,
          assignee_name = @assignee_name,
          assigned_at = @assigned_at,
          status = @status
      WHERE record_id = @record_id
    `);

  await flowInstance.createTodo(record.instance_id, recordId, signUserId, signUserName, record.node_code);

  await flowInstance.addApprovalHistory(record.instance_id, recordId, operator, 'add_sign', `Added ${signUserName} to approval: ${comment}`);

  await flowInstance.addRunLog(record.instance_id, null, 'info', record.node_code, `Added ${signUserName} to approval flow`);

  return { success: true };
}

module.exports = {
  approve,
  reject,
  processApproval,
  transferApproval,
  getApprovalHistory,
  getApprovalDetail,
  consult,
  addSign,
  APPROVAL_ACTIONS
};