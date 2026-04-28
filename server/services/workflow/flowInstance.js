const sql = require('mssql');
const { getPool } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const flowDefinition = require('./flowDefinition');
const eventPublisher = require('../eventPublisher');

const INSTANCE_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  REJECTED: 'rejected',
  TIMEOUT: 'timeout'
};

const NODE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
  TIMEOUT: 'timeout'
};

async function ensureTables() {
  const pool = await getPool();

  const tableDefinitions = [
    {
      name: 'wf_instance',
      create: `IF OBJECT_ID('dbo.wf_instance','U') IS NULL
     CREATE TABLE dbo.wf_instance (
       instance_id INT IDENTITY(1,1) PRIMARY KEY,
       flow_id INT NOT NULL,
       version_id INT NOT NULL,
       biz_id NVARCHAR(100) NOT NULL,
       module_code NVARCHAR(50) NOT NULL,
       biz_data NVARCHAR(MAX) NULL,
       current_node_id INT NULL,
       status NVARCHAR(30) DEFAULT 'running',
       start_user_id INT NULL,
       start_at DATETIME DEFAULT GETDATE(),
       end_at DATETIME NULL,
       trace_id NVARCHAR(100) NULL
     )`,
      addColumns: [
        { name: 'module_code', type: 'NVARCHAR(50) NULL' }
      ]
    },
    {
      name: 'wf_instance_node',
      create: `IF OBJECT_ID('dbo.wf_instance_node','U') IS NULL
     CREATE TABLE dbo.wf_instance_node (
       record_id INT IDENTITY(1,1) PRIMARY KEY,
       instance_id INT NOT NULL,
       node_id INT NOT NULL,
       node_code NVARCHAR(50) NOT NULL,
       node_type NVARCHAR(30) NOT NULL,
       status NVARCHAR(30) DEFAULT 'pending',
       assignee_id INT NULL,
       assignee_name NVARCHAR(100) NULL,
       assigned_at DATETIME NULL,
       finished_at DATETIME NULL,
       action NVARCHAR(30) NULL,
       comment NVARCHAR(500) NULL
     )`,
      addColumns: []
    },
    {
      name: 'wf_approval_history',
      create: `IF OBJECT_ID('dbo.wf_approval_history','U') IS NULL
     CREATE TABLE dbo.wf_approval_history (
       history_id INT IDENTITY(1,1) PRIMARY KEY,
       instance_id INT NOT NULL,
       record_id INT NOT NULL,
       operator_id INT NOT NULL,
       operator_name NVARCHAR(100) NOT NULL,
       action NVARCHAR(30) NOT NULL,
       comment NVARCHAR(500) NULL,
       operate_at DATETIME DEFAULT GETDATE()
     )`,
      addColumns: []
    },
    {
      name: 'wf_run_log',
      create: `IF OBJECT_ID('dbo.wf_run_log','U') IS NULL
     CREATE TABLE dbo.wf_run_log (
       log_id INT IDENTITY(1,1) PRIMARY KEY,
       instance_id INT NOT NULL,
       trace_id NVARCHAR(100) NULL,
       log_level NVARCHAR(20) DEFAULT 'info',
       node_code NVARCHAR(50) NULL,
       message NVARCHAR(1000) NOT NULL,
       details NVARCHAR(MAX) NULL,
       created_at DATETIME DEFAULT GETDATE()
     )`,
      addColumns: []
    },
    {
      name: 'wf_todo',
      create: `IF OBJECT_ID('dbo.wf_todo','U') IS NULL
     CREATE TABLE dbo.wf_todo (
       todo_id INT IDENTITY(1,1) PRIMARY KEY,
       instance_id INT NOT NULL,
       record_id INT NOT NULL,
       assignee_id INT NULL,
       assignee_name NVARCHAR(100) NULL,
       todo_type NVARCHAR(30) DEFAULT 'approval',
       priority INT DEFAULT 0,
       status NVARCHAR(20) DEFAULT 'pending',
       due_date DATETIME NULL,
       created_at DATETIME DEFAULT GETDATE(),
       finished_at DATETIME NULL
     )`,
      addColumns: []
    },
    {
      name: 'sys_roles',
      create: `IF OBJECT_ID('dbo.sys_roles','U') IS NULL
     CREATE TABLE dbo.sys_roles (
       role_id INT IDENTITY(1,1) PRIMARY KEY,
       role_code NVARCHAR(50) NOT NULL UNIQUE,
       role_name NVARCHAR(100) NOT NULL,
       role_desc NVARCHAR(500) NULL,
       status NVARCHAR(20) DEFAULT 'active',
       created_at DATETIME DEFAULT GETDATE(),
       updated_at DATETIME DEFAULT GETDATE()
     )`,
      addColumns: []
    },
    {
      name: 'sys_user_roles',
      create: `IF OBJECT_ID('dbo.sys_user_roles','U') IS NULL
     CREATE TABLE dbo.sys_user_roles (
       id INT IDENTITY(1,1) PRIMARY KEY,
       user_id INT NOT NULL,
       role_id INT NOT NULL,
       created_at DATETIME DEFAULT GETDATE()
     )`,
      addColumns: []
    }
  ];

  for (const table of tableDefinitions) {
    try {
      const request = pool.request();
      await request.query(table.create);

      for (const col of table.addColumns) {
        try {
          const checkRequest = pool.request();
          await checkRequest.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Object_ID = Object_ID('dbo.${table.name}') AND name = '${col.name}')
            BEGIN
              ALTER TABLE dbo.${table.name} ADD ${col.name} ${col.type}
            END
          `);
        } catch (colErr) {
          console.warn(`[ensureTables] Column check/add for ${table.name}.${col.name} warning:`, colErr.message);
        }
      }
    } catch (err) {
      console.warn(`[ensureTables] Table ${table.name} creation warning:`, err.message);
    }
  }

  const roleCount = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.sys_roles');
  if (roleCount.recordset[0].cnt === 0) {
    await pool.request().query(`
      INSERT INTO dbo.sys_roles (role_code, role_name, role_desc, status)
      VALUES
        ('admin', '系统管理员', '拥有系统所有权限', 'active'),
        ('supervisor', '主管', '管理部门和下属员工', 'active'),
        ('manager', '经理', '管理特定业务模块', 'active'),
        ('employee', '普通员工', '基本操作权限', 'active'),
        ('finance', '财务', '财务相关权限', 'active'),
        ('hr', '人事', '人事管理权限', 'active'),
        ('warehouse', '仓库管理员', '仓库管理权限', 'active'),
        ('sales', '销售', '销售管理权限', 'active')
    `);
  }
}

async function startFlowInstance(flowCode, bizId, bizData, operator, moduleCode) {
  await ensureTables();
  flowDefinition.ensureTables();

  const flow = await flowDefinition.getFlowByCode(flowCode);
  if (!flow) {
    throw new Error(`Flow not found: ${flowCode}`);
  }

  if (flow.status !== 'active') {
    throw new Error(`Flow is not active: ${flowCode}`);
  }

  const bindingError = await checkModuleBinding(flow.flow_id, moduleCode);
  if (bindingError) {
    throw new Error(bindingError);
  }

  const traceId = `trace-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const pool = await getPool();
  const request = pool.request();

  request.input('flow_id', sql.Int, flow.flow_id);
  request.input('version_id', sql.Int, flow.current_version_id);
  request.input('biz_id', sql.NVarChar, bizId);
  request.input('module_code', sql.NVarChar, moduleCode);
  request.input('biz_data', sql.NVarChar(sql.MAX), JSON.stringify(bizData));
  request.input('status', sql.NVarChar, INSTANCE_STATUS.RUNNING);
  request.input('start_user_id', sql.Int, operator.userId);
  request.input('trace_id', sql.NVarChar, traceId);

  const result = await request.query(`
    INSERT INTO dbo.wf_instance
      (flow_id, version_id, biz_id, module_code, biz_data, status, start_user_id, trace_id)
    VALUES
      (@flow_id, @version_id, @biz_id, @module_code, @biz_data, @status, @start_user_id, @trace_id);
    SELECT SCOPE_IDENTITY() as instance_id;
  `);

  const instanceId = result.recordset[0].instance_id;

  await addRunLog(instanceId, traceId, 'info', null, 'Flow instance started');

  await eventPublisher.publish('wf.instance.started', {
    instance_id: instanceId,
    flow_id: flow.flow_id,
    flow_code: flowCode,
    biz_id: bizId,
    module_code: moduleCode,
    operator: operator
  }, operator);

  const nodes = flow.current_config.nodes || [];
  const startNode = nodes.find(n => n.is_start);

  if (startNode) {
    await createInstanceNode(instanceId, startNode, operator);
    await moveToNextNode(instanceId, startNode, operator);
  }

  return getInstanceById(instanceId);
}

async function checkModuleBinding(flowId, moduleCode) {
  const bindings = await flowDefinition.getBindingsByModule(moduleCode);
  const binding = bindings.find(b => b.flow_id === flowId);
  if (!binding) {
    return `Flow is not bound to module ${moduleCode}. Please bind the flow to this module first.`;
  }
  return null;
}

async function validateCrossModuleCall(flowCode, moduleCode, operator) {
  await ensureTables();
  const flow = await flowDefinition.getFlowByCode(flowCode);
  if (!flow) {
    throw new Error(`Flow not found: ${flowCode}`);
  }

  const bindingError = await checkModuleBinding(flow.flow_id, moduleCode);
  if (bindingError) {
    const error = new Error(bindingError);
    error.code = 'MODULE_BINDING_ERROR';
    error.status = 403;
    throw error;
  }

  return flow;
}

async function startFlowInstanceAsync(taskId, flowCode, bizId, bizData, operator, moduleCode, callbackUrl) {
  const pool = await getPool();

  await pool.request()
    .input('task_id', sql.NVarChar, taskId)
    .input('flow_code', sql.NVarChar, flowCode)
    .input('biz_id', sql.NVarChar, bizId)
    .input('biz_data', sql.NVarChar(sql.MAX), JSON.stringify(bizData))
    .input('module_code', sql.NVarChar, moduleCode)
    .input('callback_url', sql.NVarChar, callbackUrl || null)
    .input('status', sql.NVarChar, 'pending')
    .input('operator_info', sql.NVarChar(sql.MAX), JSON.stringify(operator))
    .query(`
      INSERT INTO dbo.wf_async_task
        (task_id, flow_code, biz_id, biz_data, module_code, callback_url, status, operator_info, created_at)
      VALUES
        (@task_id, @flow_code, @biz_id, @biz_data, @module_code, @callback_url, @status, @operator_info, GETDATE())
    `);

  setImmediate(async () => {
    try {
      const instance = await startFlowInstance(flowCode, bizId, bizData, operator, moduleCode);

      await pool.request()
        .input('task_id', sql.NVarChar, taskId)
        .input('status', sql.NVarChar, 'completed')
        .input('result', sql.NVarChar(sql.MAX), JSON.stringify({ success: true, instance_id: instance.instance_id }))
        .input('finished_at', sql.DateTime, new Date())
        .query(`
          UPDATE dbo.wf_async_task
          SET status = @status, result = @result, finished_at = @finished_at
          WHERE task_id = @task_id
        `);

      if (callbackUrl) {
        try {
          await fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: taskId,
              status: 'completed',
              instance_id: instance.instance_id,
              result: { success: true, instance_id: instance.instance_id }
            })
          });
        } catch (cbError) {
          console.error('[FlowInstance] Callback failed:', cbError);
        }
      }

      await eventPublisher.publish('wf.async.completed', {
        task_id: taskId,
        instance_id: instance.instance_id,
        flow_code: flowCode,
        operator: operator
      }, operator);

    } catch (error) {
      console.error('[FlowInstance] Async task failed:', error);

      await pool.request()
        .input('task_id', sql.NVarChar, taskId)
        .input('status', sql.NVarChar, 'failed')
        .input('error_message', sql.NVarChar(sql.MAX), error.message)
        .input('finished_at', sql.DateTime, new Date())
        .query(`
          UPDATE dbo.wf_async_task
          SET status = @status, error_message = @error_message, finished_at = @finished_at
          WHERE task_id = @task_id
        `);

      if (callbackUrl) {
        try {
          await fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: taskId,
              status: 'failed',
              error: error.message
            })
          });
        } catch (cbError) {
          console.error('[FlowInstance] Callback failed:', cbError);
        }
      }

      await eventPublisher.publish('wf.async.failed', {
        task_id: taskId,
        flow_code: flowCode,
        error: error.message,
        operator: operator
      }, operator);
    }
  });

  return { task_id: taskId, status: 'pending' };
}

async function getAsyncTaskStatus(taskId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('task_id', sql.NVarChar, taskId)
    .query(`SELECT * FROM dbo.wf_async_task WHERE task_id = @task_id`);
  return result.recordset[0] || null;
}

async function cancelInstance(instanceId, operator, reason) {
  await ensureTables();
  const instance = await getInstanceById(instanceId);
  if (!instance) {
    throw new Error('Instance not found');
  }

  if (instance.status !== INSTANCE_STATUS.RUNNING) {
    throw new Error(`Cannot cancel instance with status: ${instance.status}`);
  }

  const pool = await getPool();

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('end_at', sql.DateTime, new Date())
    .input('status', sql.NVarChar, INSTANCE_STATUS.TERMINATED)
    .query(`
      UPDATE dbo.wf_instance
      SET status = @status, end_at = @end_at
      WHERE instance_id = @instance_id
    `);

  await addRunLog(instanceId, null, 'warn', null, `Flow instance cancelled by ${operator.userName || operator.userId}: ${reason || 'No reason provided'}`);

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('status', sql.NVarChar, 'cancelled')
    .query(`
      UPDATE dbo.wf_todo
      SET status = @status, updated_at = GETDATE()
      WHERE instance_id = @instance_id AND status = 'pending'
    `);

  await eventPublisher.publish('wf.instance.cancelled', {
    instance_id: instanceId,
    operator: operator,
    reason: reason
  }, operator);

  return getInstanceById(instanceId);
}

async function createInstanceNode(instanceId, node, operator) {
  const pool = await getPool();
  const request = pool.request();

  request.input('instance_id', sql.Int, instanceId);
  request.input('node_id', sql.Int, node.node_id || 0);
  request.input('node_code', sql.NVarChar, node.node_code);
  request.input('node_type', sql.NVarChar, node.node_type);
  request.input('status', sql.NVarChar, NODE_STATUS.PENDING);

  const result = await request.query(`
    INSERT INTO dbo.wf_instance_node
      (instance_id, node_id, node_code, node_type, status)
    VALUES
      (@instance_id, @node_id, @node_code, @node_type, @status);
    SELECT SCOPE_IDENTITY() as record_id;
  `);

  const recordId = result.recordset[0].record_id;

  if ([flowDefinition.NODE_TYPES.APPROVAL_SINGLE, flowDefinition.NODE_TYPES.APPROVAL_MULTI].includes(node.node_type)) {
    const assignees = await resolveAssignees(node, operator);
    for (const assignee of assignees) {
      await assignToUser(recordId, assignee.userId, assignee.userName);
    }
  }

  await addRunLog(instanceId, null, 'info', node.node_code, `Created node: ${node.node_name}`);

  return recordId;
}

async function resolveAssignees(node, operator) {
  const assignees = [];
  const config = node.config || {};
  const rules = node.rules || [];

  for (const rule of rules) {
    switch (rule.rule_type) {
      case flowDefinition.RULE_TYPES.ASSIGN_USER:
        assignees.push({ userId: parseInt(rule.rule_value), userName: rule.userName || 'User' });
        break;
      case flowDefinition.RULE_TYPES.ASSIGN_ROLE:
        assignees.push(...(await getUsersByRole(rule.rule_value)));
        break;
      case flowDefinition.RULE_TYPES.ASSIGN_SUPERIOR:
        assignees.push(...(await getSuperiorUsers(operator.userId)));
        break;
      case flowDefinition.RULE_TYPES.ASSIGN_GROUP:
        assignees.push(...(await getGroupMembers(rule.rule_value)));
        break;
    }
  }

  return assignees.filter((a, i) => assignees.findIndex(x => x.userId === a.userId) === i);
}

async function getUsersByRole(roleCode) {
  const pool = await getPool();
  const result = await pool.request()
    .input('role_code', sql.NVarChar, roleCode)
    .query(`
      SELECT u.id as userId, u.name as userName
      FROM dbo.sys_users u
      JOIN dbo.sys_user_roles ur ON u.id = ur.user_id
      JOIN dbo.sys_roles r ON ur.role_id = r.id
      WHERE r.code = @role_code AND u.status = 'active'
    `);
  return result.recordset;
}

async function getSuperiorUsers(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .query(`
      SELECT u.id as userId, u.name as userName
      FROM dbo.sys_users u
      WHERE u.id = (SELECT parent_id FROM dbo.sys_users WHERE id = @user_id)
    `);
  return result.recordset;
}

async function getGroupMembers(groupId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('group_id', sql.Int, groupId)
    .query(`
      SELECT ag.group_id, ag.member_ids
      FROM dbo.wf_approval_group ag
      WHERE ag.group_id = @group_id
    `);

  if (result.recordset.length === 0) return [];

  const memberIds = JSON.parse(result.recordset[0].member_ids || '[]');
  if (memberIds.length === 0) return [];

  const userResult = await pool.request().query(`
    SELECT id as userId, name as userName
    FROM dbo.sys_users
    WHERE id IN (${memberIds.map((_, i) => `@p${i}`).join(',')})
  `);

  return userResult.recordset;
}

async function assignToUser(recordId, userId, userName) {
  const pool = await getPool();

  await pool.request()
    .input('record_id', sql.Int, recordId)
    .input('assignee_id', sql.Int, userId)
    .input('assignee_name', sql.NVarChar, userName)
    .input('assigned_at', sql.DateTime, new Date())
    .query(`
      UPDATE dbo.wf_instance_node
      SET assignee_id = @assignee_id,
          assignee_name = @assignee_name,
          assigned_at = @assigned_at
      WHERE record_id = @record_id
    `);

  const record = await getNodeRecord(recordId);
  await createTodo(record.instance_id, recordId, userId, userName, record.node_code);
}

async function createTodo(instanceId, recordId, userId, userName, nodeCode) {
  const pool = await getPool();
  const request = pool.request();

  const instance = await getInstanceById(instanceId);

  request.input('instance_id', sql.Int, instanceId);
  request.input('record_id', sql.Int, recordId);
  request.input('assignee_id', sql.Int, userId);
  request.input('assignee_name', sql.NVarChar, userName);
  request.input('title', sql.NVarChar, `待审批: ${instance.flow_name || nodeCode}`);
  request.input('content', sql.NVarChar, `您有一个待处理的审批任务`);
  request.input('status', sql.NVarChar, 'pending');

  await request.query(`
    INSERT INTO dbo.wf_todo
      (instance_id, record_id, assignee_id, assignee_name, title, content, status)
    VALUES
      (@instance_id, @record_id, @assignee_id, @assignee_name, @title, @content, @status)
  `);
}

async function moveToNextNode(instanceId, currentNode, operator) {
  const instance = await getInstanceById(instanceId);
  const flow = await flowDefinition.getFlowById(instance.flow_id);
  const nodes = flow.current_config.nodes || [];

  let nextNodes = [];
  if (currentNode.next_node_ids) {
    const nextIds = currentNode.next_node_ids.split(',').map(id => id.trim());
    nextNodes = nodes.filter(n => nextIds.includes(n.node_code));
  }

  if (nextNodes.length === 0) {
    nextNodes = nodes.filter(n => {
      const prevIds = n.prev_node_ids ? n.prev_node_ids.split(',').map(id => id.trim()) : [];
      return prevIds.includes(currentNode.node_code);
    });
  }

  const conditionNodes = nextNodes.filter(n => n.node_type === flowDefinition.NODE_TYPES.CONDITION);
  if (conditionNodes.length > 0) {
    for (const condNode of conditionNodes) {
      if (evaluateCondition(condNode, instance)) {
        nextNodes = nodes.filter(n => {
          const nextIds = n.next_node_ids ? n.next_node_ids.split(',').map(id => id.trim()) : [];
          return nextIds.includes(condNode.node_code);
        });
        break;
      }
    }
  }

  for (const nextNode of nextNodes) {
    if (nextNode.is_end) {
      await completeInstance(instanceId, operator);
      return;
    }

    const recordId = await createInstanceNode(instanceId, nextNode, operator);

    if (nextNode.node_type === flowDefinition.NODE_TYPES.ACTION) {
      await executeActionNode(instanceId, nextNode, operator);
    } else if (nextNode.node_type === flowDefinition.NODE_TYPES.NOTIFY) {
      await executeNotifyNode(instanceId, nextNode, operator);
    } else {
      await moveToNextNode(instanceId, nextNode, operator);
    }
  }

  await updateInstanceCurrentNode(instanceId, nextNodes[0]?.node_id);
}

async function evaluateCondition(node, instance) {
  const config = node.config || {};
  const bizData = JSON.parse(instance.biz_data || '{}');

  if (config.condition_expression) {
    try {
      const expression = config.condition_expression
        .replace(/\{(\w+)\}/g, (_, key) => JSON.stringify(bizData[key] ?? null));
      return eval(expression);
    } catch (e) {
      console.error('[FlowInstance] Condition eval error:', e);
      return false;
    }
  }

  return true;
}

async function executeActionNode(instanceId, node, operator) {
  const config = node.config || {};

  await addRunLog(instanceId, null, 'info', node.node_code, `Executing action: ${config.action_name || node.node_name}`);

  if (config.action_type === 'webhook') {
    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instanceId,
          node_code: node.node_code,
          biz_data: JSON.parse((await getInstanceById(instanceId)).biz_data || '{}'),
          operator: operator
        })
      });
      console.log(`[FlowInstance] Webhook called: ${config.webhook_url}, response: ${response.status}`);
    } catch (e) {
      console.error('[FlowInstance] Webhook error:', e);
      await addRunLog(instanceId, null, 'error', node.node_code, `Webhook failed: ${e.message}`);
    }
  }

  await updateNodeRecordStatus(instanceId, node.node_code, NODE_STATUS.APPROVED);
  await moveToNextNode(instanceId, node, operator);
}

async function executeNotifyNode(instanceId, node, operator) {
  const config = node.config || {};

  await addRunLog(instanceId, null, 'info', node.node_code, `Sending notification: ${config.notify_type || 'system'}`);

  console.log(`[FlowInstance] Notification sent: ${JSON.stringify(config)}`);

  await updateNodeRecordStatus(instanceId, node.node_code, NODE_STATUS.APPROVED);
  await moveToNextNode(instanceId, node, operator);
}

async function updateNodeRecordStatus(instanceId, nodeCode, status) {
  const pool = await getPool();
  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('node_code', sql.NVarChar, nodeCode)
    .input('status', sql.NVarChar, status)
    .input('finished_at', sql.DateTime, new Date())
    .query(`
      UPDATE dbo.wf_instance_node
      SET status = @status, finished_at = @finished_at
      WHERE instance_id = @instance_id AND node_code = @node_code
    `);
}

async function updateInstanceCurrentNode(instanceId, nodeId) {
  const pool = await getPool();
  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('current_node_id', sql.Int, nodeId || null)
    .query(`
      UPDATE dbo.wf_instance SET current_node_id = @current_node_id WHERE instance_id = @instance_id
    `);
}

async function completeInstance(instanceId, operator) {
  const pool = await getPool();

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('end_at', sql.DateTime, new Date())
    .input('status', sql.NVarChar, INSTANCE_STATUS.COMPLETED)
    .query(`
      UPDATE dbo.wf_instance
      SET status = @status, end_at = @end_at
      WHERE instance_id = @instance_id
    `);

  await addRunLog(instanceId, null, 'info', null, 'Flow instance completed');

  await eventPublisher.publish('wf.instance.completed', {
    instance_id: instanceId,
    operator: operator
  }, operator);
}

async function addRunLog(instanceId, traceId, level, nodeCode, message, details = null) {
  const pool = await getPool();
  const request = pool.request();

  request.input('instance_id', sql.Int, instanceId);
  request.input('trace_id', sql.NVarChar, traceId || null);
  request.input('log_level', sql.NVarChar, level);
  request.input('node_code', sql.NVarChar, nodeCode || null);
  request.input('message', sql.NVarChar, message);
  request.input('details', sql.NVarChar(sql.MAX), details);

  await request.query(`
    INSERT INTO dbo.wf_run_log (instance_id, trace_id, log_level, node_code, message, details)
    VALUES (@instance_id, @trace_id, @log_level, @node_code, @message, @details)
  `);
}

async function getInstanceById(instanceId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT wi.*, wfd.flow_name, wfd.flow_code,
             wfv.version_number, wfv.config as flow_config
      FROM dbo.wf_instance wi
      JOIN dbo.wf_flow_definition wfd ON wi.flow_id = wfd.flow_id
      LEFT JOIN dbo.wf_flow_version wfv ON wi.version_id = wfv.version_id
      WHERE wi.instance_id = @instance_id
    `);

  if (result.recordset.length === 0) return null;

  const instance = result.recordset[0];
  instance.biz_data = JSON.parse(instance.biz_data || '{}');

  if (instance.flow_config) {
    instance.current_config = JSON.parse(instance.flow_config);
  }

  const nodesResult = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT win.*, su.name as assignee_name, su.name as operator_name
      FROM dbo.wf_instance_node win
      LEFT JOIN dbo.sys_users su ON win.assignee_id = su.id
      WHERE win.instance_id = @instance_id
      ORDER BY win.record_id
    `);
  instance.node_records = nodesResult.recordset;

  const historyResult = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT wah.*, su.name as user_name
      FROM dbo.wf_approval_history wah
      LEFT JOIN dbo.sys_users su ON wah.operator_id = su.id
      WHERE wah.instance_id = @instance_id
      ORDER BY wah.created_at
    `);
  instance.approval_history = historyResult.recordset;

  return instance;
}

async function getInstanceList(filters = {}) {
  await ensureTables();
  const pool = await getPool();
  const request = pool.request();

  let whereClause = 'WHERE 1=1';
  let paramIndex = 0;

  if (filters.flow_id) {
    paramIndex++;
    whereClause += ` AND wi.flow_id = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.Int, filters.flow_id);
  }

  if (filters.module_code) {
    paramIndex++;
    whereClause += ` AND wi.module_code = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.NVarChar, filters.module_code);
  }

  if (filters.status) {
    paramIndex++;
    whereClause += ` AND wi.status = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.NVarChar, filters.status);
  }

  if (filters.biz_id) {
    paramIndex++;
    whereClause += ` AND wi.biz_id = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.NVarChar, filters.biz_id);
  }

  if (filters.start_user_id) {
    paramIndex++;
    whereClause += ` AND wi.start_user_id = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.Int, filters.start_user_id);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const countResult = await request.query(`
    SELECT COUNT(*) as total FROM dbo.wf_instance wi ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  const result = await request.query(`
    SELECT wi.*, wfd.flow_name, wfd.flow_code, su.name as start_user_name
    FROM dbo.wf_instance wi
    JOIN dbo.wf_flow_definition wfd ON wi.flow_id = wfd.flow_id
    LEFT JOIN dbo.sys_users su ON wi.start_user_id = su.id
    ${whereClause}
    ORDER BY wi.start_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    instances: result.recordset,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getNodeRecord(recordId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('record_id', sql.Int, recordId)
    .query(`SELECT * FROM dbo.wf_instance_node WHERE record_id = @record_id`);
  return result.recordset[0];
}

async function getRunLogs(instanceId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .query(`
      SELECT * FROM dbo.wf_run_log
      WHERE instance_id = @instance_id
      ORDER BY created_at ASC
    `);
  return result.recordset;
}

async function terminateInstance(instanceId, operator) {
  await ensureTables();
  const pool = await getPool();

  await pool.request()
    .input('instance_id', sql.Int, instanceId)
    .input('end_at', sql.DateTime, new Date())
    .input('status', sql.NVarChar, INSTANCE_STATUS.TERMINATED)
    .query(`
      UPDATE dbo.wf_instance
      SET status = @status, end_at = @end_at
      WHERE instance_id = @instance_id
    `);

  await addRunLog(instanceId, null, 'warn', null, 'Flow instance terminated by admin');

  await eventPublisher.publish('wf.instance.terminated', {
    instance_id: instanceId,
    operator: operator
  }, operator);

  return getInstanceById(instanceId);
}

async function forceApproveInstance(instanceId, operator, comment) {
  await ensureTables();
  const instance = await getInstanceById(instanceId);

  await addApprovalHistory(instance.instance_id, instance.current_node_id || 0, operator, 'force_approve', comment);

  await pool.request()
    .input('record_id', sql.Int, instance.current_node_id)
    .input('finished_at', sql.DateTime, new Date())
    .input('action', sql.NVarChar, 'force_approve')
    .input('comment', sql.NVarChar, comment)
    .query(`
      UPDATE dbo.wf_instance_node
      SET status = 'approved', finished_at = @finished_at, action = @action, comment = @comment
      WHERE record_id = @record_id
    `);

  const nodes = (await flowDefinition.getFlowById(instance.flow_id)).current_config.nodes || [];
  const currentNode = nodes.find(n => n.node_id === instance.current_node_id);

  if (currentNode) {
    await moveToNextNode(instanceId, currentNode, operator);
  }

  return getInstanceById(instanceId);
}

async function addApprovalHistory(instanceId, recordId, operator, action, comment) {
  const pool = await getPool();
  const request = pool.request();

  request.input('instance_id', sql.Int, instanceId);
  request.input('record_id', sql.Int, recordId);
  request.input('operator_id', sql.Int, operator.userId);
  request.input('operator_name', sql.NVarChar, operator.userName || operator.name);
  request.input('action', sql.NVarChar, action);
  request.input('comment', sql.NVarChar, comment);

  await request.query(`
    INSERT INTO dbo.wf_approval_history
      (instance_id, record_id, operator_id, operator_name, action, comment)
    VALUES
      (@instance_id, @record_id, @operator_id, @operator_name, @action, @comment)
  `);
}

async function getTodoList(userId, filters = {}) {
  await ensureTables();
  const pool = await getPool();
  const request = pool.request();

  let whereClause = 'WHERE wt.assignee_id = @user_id';
  request.input('user_id', sql.Int, userId);

  if (filters.status) {
    whereClause += ' AND wt.status = @status';
    request.input('status', sql.NVarChar, filters.status);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const countResult = await request.query(`
    SELECT COUNT(*) as total FROM dbo.wf_todo wt ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  const result = await request.query(`
    SELECT wt.*, wi.biz_id, wi.biz_data, wfd.flow_name
    FROM dbo.wf_todo wt
    JOIN dbo.wf_instance wi ON wt.instance_id = wi.instance_id
    JOIN dbo.wf_flow_definition wfd ON wi.flow_id = wfd.flow_id
    ${whereClause}
    ORDER BY wt.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    todos: result.recordset.map(t => ({
      ...t,
      biz_data: JSON.parse(t.biz_data || '{}')
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getInstanceStats(filters = {}) {
  try {
    await ensureTables();
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';
    let paramIndex = 0;

    if (filters.module_code) {
      paramIndex++;
      whereClause += ` AND wi.module_code = @p${paramIndex}`;
      request.input(`p${paramIndex}`, sql.NVarChar, filters.module_code);
    }

    const result = await request.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN wi.status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN wi.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN wi.status = 'terminated' THEN 1 ELSE 0 END) as terminated
      FROM dbo.wf_instance wi
      ${whereClause}
    `);

    const stats = result.recordset[0] || { total: 0, running: 0, completed: 0, rejected: 0, terminated: 0 };

    return {
      total: stats.total || 0,
      running: stats.running || 0,
      completed: stats.completed || 0,
      rejected: stats.rejected || 0,
      terminated: stats.terminated || 0
    };
  } catch (error) {
    console.error('[FlowInstance] getInstanceStats error:', error);
    return { total: 0, running: 0, completed: 0, rejected: 0, terminated: 0 };
  }
}

module.exports = {
  ensureTables,
  startFlowInstance,
  startFlowInstanceAsync,
  getAsyncTaskStatus,
  validateCrossModuleCall,
  createInstanceNode,
  getInstanceById,
  getInstanceList,
  getNodeRecord,
  getRunLogs,
  terminateInstance,
  forceApproveInstance,
  cancelInstance,
  addApprovalHistory,
  getTodoList,
  getInstanceStats,
  INSTANCE_STATUS,
  NODE_STATUS
};