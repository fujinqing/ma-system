const sql = require('mssql');
const { getPool } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const NODE_TYPES = {
  START: 'start',
  END: 'end',
  APPROVAL_SINGLE: 'approval_single',
  APPROVAL_MULTI: 'approval_multi',
  CONDITION: 'condition',
  ACTION: 'action',
  NOTIFY: 'notify',
  INITIATOR: 'initiator',
  DEPT_MANAGER: 'dept_manager',
  ROLE_APPROVAL: 'role_approval',
  CC: 'cc',
  COUNTERSIGN: 'countersign',
  OR_SIGN: 'or_sign',
  AUTO_ACTION: 'auto_action',
  BRANCH_CONDITION: 'branch_condition',
  REJECT_BRANCH: 'reject_branch',
  TIMEOUT: 'timeout'
};

const NODE_TYPE_NAMES = {
  start: '开始节点',
  end: '结束节点',
  approval_single: '单人审批',
  approval_multi: '多人审批',
  condition: '条件分支',
  action: '操作节点',
  notify: '通知节点',
  initiator: '发起人节点',
  dept_manager: '部门主管',
  role_approval: '角色审批',
  cc: '抄送节点',
  countersign: '会签节点',
  or_sign: '或签节点',
  auto_action: '自动处理',
  branch_condition: '分支条件',
  reject_branch: '驳回分支',
  timeout: '超时节点'
};

const FLOW_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  ARCHIVED: 'archived'
};

const RULE_TYPES = {
  ASSIGN_USER: 'assign_user',
  ASSIGN_ROLE: 'assign_role',
  ASSIGN_SUPERIOR: 'assign_superior',
  ASSIGN_GROUP: 'assign_group',
  APPROVAL_ANY: 'approval_any',
  APPROVAL_ALL: 'approval_all',
  APPROVAL_SEQUENCE: 'approval_sequence',
  APPROVAL_TIMEOUT_PASS: 'timeout_pass',
  APPROVAL_TIMEOUT_REJECT: 'timeout_reject'
};

async function ensureTables() {
  const pool = await getPool();
  const request = pool.request();

  const tables = [
    `IF OBJECT_ID('dbo.wf_flow_definition','U') IS NULL
     CREATE TABLE dbo.wf_flow_definition (
       flow_id INT IDENTITY(1,1) PRIMARY KEY,
       flow_code NVARCHAR(50) NOT NULL UNIQUE,
       flow_name NVARCHAR(200) NOT NULL,
       flow_desc NVARCHAR(1000) NULL,
       module_code NVARCHAR(50) NOT NULL,
       is_default BIT DEFAULT 0,
       version_count INT DEFAULT 1,
       current_version INT DEFAULT 1,
       status NVARCHAR(20) DEFAULT 'draft',
       created_by INT NULL,
       created_at DATETIME DEFAULT GETDATE(),
       updated_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_flow_version','U') IS NULL
     CREATE TABLE dbo.wf_flow_version (
       version_id INT IDENTITY(1,1) PRIMARY KEY,
       flow_id INT NOT NULL,
       version_number INT NOT NULL,
       flow_config NVARCHAR(MAX) NOT NULL,
       node_count INT DEFAULT 0,
       status NVARCHAR(20) DEFAULT 'draft',
       change_desc NVARCHAR(500) NULL,
       created_by INT NULL,
       created_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_flow_node','U') IS NULL
     CREATE TABLE dbo.wf_flow_node (
       node_id INT IDENTITY(1,1) PRIMARY KEY,
       version_id INT NOT NULL,
       node_code NVARCHAR(50) NOT NULL,
       node_name NVARCHAR(200) NOT NULL,
       node_type NVARCHAR(30) NOT NULL,
       position_x INT DEFAULT 0,
       position_y INT DEFAULT 0,
       prev_node_ids NVARCHAR(500) NULL,
       next_node_ids NVARCHAR(500) NULL,
       is_start BIT DEFAULT 0,
       is_end BIT DEFAULT 0,
       created_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_node_config','U') IS NULL
     CREATE TABLE dbo.wf_node_config (
       config_id INT IDENTITY(1,1) PRIMARY KEY,
       node_id INT NOT NULL,
       config_key NVARCHAR(100) NOT NULL,
       config_value NVARCHAR(MAX) NULL
     )`,
    `IF OBJECT_ID('dbo.wf_approval_rule','U') IS NULL
     CREATE TABLE dbo.wf_approval_rule (
       rule_id INT IDENTITY(1,1) PRIMARY KEY,
       node_id INT NOT NULL,
       rule_type NVARCHAR(30) NOT NULL,
       rule_value NVARCHAR(MAX) NULL,
       priority INT DEFAULT 0
     )`,
    `IF OBJECT_ID('dbo.wf_approval_group','U') IS NULL
     CREATE TABLE dbo.wf_approval_group (
       group_id INT IDENTITY(1,1) PRIMARY KEY,
       group_code NVARCHAR(50) NOT NULL UNIQUE,
       group_name NVARCHAR(200) NOT NULL,
       group_type NVARCHAR(30) NOT NULL,
       member_ids NVARCHAR(MAX) NULL,
       member_roles NVARCHAR(MAX) NULL,
       created_by INT NULL,
       created_at DATETIME DEFAULT GETDATE(),
       updated_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_module_binding','U') IS NULL
     CREATE TABLE dbo.wf_module_binding (
       binding_id INT IDENTITY(1,1) PRIMARY KEY,
       flow_id INT NOT NULL,
       module_code NVARCHAR(50) NOT NULL,
       is_default BIT DEFAULT 0,
       priority INT DEFAULT 0,
       created_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_node_template','U') IS NULL
     CREATE TABLE dbo.wf_node_template (
       template_id INT IDENTITY(1,1) PRIMARY KEY,
       template_code NVARCHAR(50) NOT NULL UNIQUE,
       template_name NVARCHAR(200) NOT NULL,
       node_type NVARCHAR(30) NOT NULL,
       template_config NVARCHAR(MAX) NOT NULL,
       is_public BIT DEFAULT 1,
       created_by INT NULL,
       created_at DATETIME DEFAULT GETDATE(),
       updated_at DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.wf_async_task','U') IS NULL
     CREATE TABLE dbo.wf_async_task (
       id INT IDENTITY(1,1) PRIMARY KEY,
       task_id NVARCHAR(100) NOT NULL UNIQUE,
       flow_code NVARCHAR(50) NOT NULL,
       biz_id NVARCHAR(100) NOT NULL,
       biz_data NVARCHAR(MAX) NULL,
       module_code NVARCHAR(50) NOT NULL,
       callback_url NVARCHAR(500) NULL,
       status NVARCHAR(20) DEFAULT 'pending',
       operator_info NVARCHAR(MAX) NULL,
       result NVARCHAR(MAX) NULL,
       error_message NVARCHAR(MAX) NULL,
       created_at DATETIME DEFAULT GETDATE(),
       finished_at DATETIME NULL
     )`
  ];

  for (const sqlStmt of tables) {
    try {
      await request.query(sqlStmt);
    } catch (err) {
      console.warn('[ensureTables] Table creation warning:', err.message);
    }
  }
}

async function createFlow(flowData, userId = null) {
  try {
    await ensureTables();
    const pool = await getPool();
    const request = pool.request();

    const flowCode = `FLOW_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;

    request.input('flow_code', sql.NVarChar, flowCode);
    request.input('flow_name', sql.NVarChar, flowData.flow_name || 'Untitled Flow');
    request.input('flow_desc', sql.NVarChar, flowData.flow_desc || null);
    request.input('module_code', sql.NVarChar, flowData.module_code || 'DEFAULT');
    request.input('is_default', sql.Bit, flowData.is_default || 0);
    request.input('status', sql.NVarChar, FLOW_STATUS.DRAFT);
    request.input('created_by', sql.Int, userId);

    const result = await request.query(`
      INSERT INTO dbo.wf_flow_definition
        (flow_code, flow_name, flow_desc, module_code, is_default, status, created_by)
      VALUES
        (@flow_code, @flow_name, @flow_desc, @module_code, @is_default, @status, @created_by);
      SELECT SCOPE_IDENTITY() as flow_id;
    `);

    const flowId = result.recordset[0].flow_id;

    if (flowData.flow_config && typeof flowData.flow_config === 'object' && flowData.flow_config.nodes && flowData.flow_config.nodes.length > 0) {
      await createVersion(flowId, flowData.flow_config, 'Initial version', userId);
    }

    if (flowData.bindings && Array.isArray(flowData.bindings) && flowData.bindings.length > 0) {
      for (const binding of flowData.bindings) {
        await createBinding(flowId, binding.module_code, binding.is_default || 0, binding.priority || 0);
      }
    }

    try {
      return await getFlowById(flowId);
    } catch (getErr) {
      console.warn('[createFlow] getFlowById warning:', getErr.message);
      return {
        flow_id: flowId,
        flow_code: flowCode,
        flow_name: flowData.flow_name || 'Untitled Flow',
        flow_desc: flowData.flow_desc,
        module_code: flowData.module_code || 'DEFAULT',
        status: 'draft',
        message: 'Flow created but details retrieval failed'
      };
    }
  } catch (error) {
    console.error('[createFlow] Error:', error);
    throw error;
  }
}

async function createVersion(flowId, flowConfig, changeDesc = '', userId = null) {
  try {
    await ensureTables();
    const pool = await getPool();
    const request = pool.request();

    request.input('flow_id', sql.Int, flowId);

    const versionResult = await request.query(`
      SELECT ISNULL(MAX(version_number), 0) + 1 as next_version
      FROM dbo.wf_flow_version WHERE flow_id = @flow_id
    `);
    const nextVersion = versionResult.recordset[0].next_version;

    const configJson = typeof flowConfig === 'string' ? flowConfig : JSON.stringify(flowConfig);
    const nodeCount = flowConfig && flowConfig.nodes ? flowConfig.nodes.length : 0;

    request.input('version_number', sql.Int, nextVersion);
    request.input('flow_config', sql.NVarChar(sql.MAX), configJson);
    request.input('node_count', sql.Int, nodeCount);
    request.input('status', sql.NVarChar, FLOW_STATUS.DRAFT);
    request.input('change_desc', sql.NVarChar, changeDesc);
    request.input('created_by', sql.Int, userId);

    const result = await request.query(`
      INSERT INTO dbo.wf_flow_version
        (flow_id, version_number, flow_config, node_count, status, change_desc, created_by)
      VALUES
        (@flow_id, @version_number, @flow_config, @node_count, @status, @change_desc, @created_by);
      SELECT SCOPE_IDENTITY() as version_id;
    `);

    const versionId = result.recordset[0].version_id;

    const updateRequest = pool.request();
    updateRequest.input('flow_id', sql.Int, flowId);
    updateRequest.input('version_number', sql.Int, nextVersion);
    await updateRequest.query(`
      UPDATE dbo.wf_flow_definition
      SET version_count = version_count + 1,
          current_version = @version_number,
          updated_at = GETDATE()
      WHERE flow_id = @flow_id
    `);

    if (flowConfig && flowConfig.nodes && Array.isArray(flowConfig.nodes)) {
      for (const node of flowConfig.nodes) {
        try {
          await createNode(versionId, node);
        } catch (nodeErr) {
          console.warn('[createVersion] createNode warning:', nodeErr.message);
        }
      }
    }

    return versionId;
  } catch (error) {
    console.warn('[createVersion] Warning:', error.message);
    return null;
  }
}

async function createNode(versionId, nodeData) {
  const pool = await getPool();
  const request = pool.request();

  request.input('version_id', sql.Int, versionId);
  request.input('node_code', sql.NVarChar, nodeData.node_code || `NODE_${Date.now()}`);
  request.input('node_name', sql.NVarChar, nodeData.node_name);
  request.input('node_type', sql.NVarChar, nodeData.node_type);
  request.input('position_x', sql.Int, nodeData.position_x || 0);
  request.input('position_y', sql.Int, nodeData.position_y || 0);
  request.input('prev_node_ids', sql.NVarChar, nodeData.prev_node_ids || null);
  request.input('next_node_ids', sql.NVarChar, nodeData.next_node_ids || null);
  request.input('is_start', sql.Bit, nodeData.is_start || false);
  request.input('is_end', sql.Bit, nodeData.is_end || false);

  const result = await request.query(`
    INSERT INTO dbo.wf_flow_node
      (version_id, node_code, node_name, node_type, position_x, position_y, prev_node_ids, next_node_ids, is_start, is_end)
    VALUES
      (@version_id, @node_code, @node_name, @node_type, @position_x, @position_y, @prev_node_ids, @next_node_ids, @is_start, @is_end);
    SELECT SCOPE_IDENTITY() as node_id;
  `);

  const nodeId = result.recordset[0].node_id;

  if (nodeData.config) {
    for (const [key, value] of Object.entries(nodeData.config)) {
      await saveNodeConfig(nodeId, key, value);
    }
  }

  if (nodeData.rules) {
    for (const rule of nodeData.rules) {
      await saveApprovalRule(nodeId, rule);
    }
  }

  return nodeId;
}

async function saveNodeConfig(nodeId, configKey, configValue) {
  const pool = await getPool();
  const request = pool.request();

  request.input('node_id', sql.Int, nodeId);
  request.input('config_key', sql.NVarChar, configKey);
  request.input('config_value', sql.NVarChar(sql.MAX), typeof configValue === 'string' ? configValue : JSON.stringify(configValue));

  await request.query(`
    IF EXISTS (SELECT 1 FROM dbo.wf_node_config WHERE node_id = @node_id AND config_key = @config_key)
      UPDATE dbo.wf_node_config SET config_value = @config_value WHERE node_id = @node_id AND config_key = @config_key
    ELSE
      INSERT INTO dbo.wf_node_config (node_id, config_key, config_value) VALUES (@node_id, @config_key, @config_value)
  `);
}

async function saveApprovalRule(nodeId, rule) {
  const pool = await getPool();
  const request = pool.request();

  request.input('node_id', sql.Int, nodeId);
  request.input('rule_type', sql.NVarChar, rule.rule_type);
  request.input('rule_value', sql.NVarChar(sql.MAX), rule.rule_value || null);
  request.input('priority', sql.Int, rule.priority || 0);

  await request.query(`
    INSERT INTO dbo.wf_approval_rule (node_id, rule_type, rule_value, priority)
    VALUES (@node_id, @rule_type, @rule_value, @priority)
  `);
}

async function getFlowById(flowId) {
  try {
    await ensureTables();
    const pool = await getPool();
    const result = await pool.request()
      .input('flow_id', sql.Int, flowId)
      .query(`
        SELECT * FROM dbo.wf_flow_definition WHERE flow_id = @flow_id
      `);

    if (result.recordset.length === 0) return null;

    const flow = result.recordset[0];

    try {
      const versionResult = await pool.request()
        .input('flow_id', sql.Int, flowId)
        .query(`
          SELECT * FROM dbo.wf_flow_version
          WHERE flow_id = @flow_id AND version_number = (SELECT MAX(version_number) FROM dbo.wf_flow_version WHERE flow_id = @flow_id)
        `);

      if (versionResult.recordset.length > 0) {
        flow.current_config = JSON.parse(versionResult.recordset[0].flow_config || '{}');
        flow.current_version_id = versionResult.recordset[0].version_id;
      }
    } catch (versionErr) {
      console.warn('[getFlowById] version query warning:', versionErr.message);
    }

    try {
      const bindingsResult = await pool.request()
        .input('flow_id', sql.Int, flowId)
        .query(`
          SELECT * FROM dbo.wf_module_binding WHERE flow_id = @flow_id
        `);
      flow.bindings = bindingsResult.recordset;
    } catch (bindingErr) {
      console.warn('[getFlowById] binding query warning:', bindingErr.message);
      flow.bindings = [];
    }

    return flow;
  } catch (error) {
    console.error('[getFlowById] Error:', error);
    return {
      flow_id: flowId,
      status: 'draft',
      message: 'Flow created but details retrieval failed'
    };
  }
}

async function getFlowByCode(flowCode) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('flow_code', sql.NVarChar, flowCode)
    .query(`
      SELECT flow_id FROM dbo.wf_flow_definition WHERE flow_code = @flow_code
    `);

  if (result.recordset.length === 0) return null;
  return getFlowById(result.recordset[0].flow_id);
}

async function getFlowList(filters = {}) {
  await ensureTables();
  const pool = await getPool();
  const request = pool.request();

  let whereClause = 'WHERE 1=1';
  let paramIndex = 0;

  if (filters.module_code) {
    paramIndex++;
    whereClause += ` AND wfd.module_code = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.NVarChar, filters.module_code);
  }

  if (filters.status) {
    paramIndex++;
    whereClause += ` AND wfd.status = @p${paramIndex}`;
    request.input(`p${paramIndex}`, sql.NVarChar, filters.status);
  }

  if (filters.keyword) {
    paramIndex++;
    whereClause += ` AND (wfd.flow_name LIKE @p${paramIndex} OR wfd.flow_code LIKE @p${paramIndex})`;
    request.input(`p${paramIndex}`, sql.NVarChar, `%${filters.keyword}%`);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const countResult = await request.query(`
    SELECT COUNT(*) as total FROM dbo.wf_flow_definition wfd ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  const result = await request.query(`
    SELECT wfd.*, wu.name as created_by_name
    FROM dbo.wf_flow_definition wfd
    LEFT JOIN dbo.sys_users wu ON wfd.created_by = wu.id
    ${whereClause}
    ORDER BY wfd.updated_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    flows: result.recordset,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function updateFlow(flowId, updateData) {
  try {
    await ensureTables();
    const pool = await getPool();
    const request = pool.request();

    const updates = [];
    let paramIndex = 0;

    if (updateData.flow_name !== undefined) {
      paramIndex++;
      updates.push(`flow_name = @p${paramIndex}`);
      request.input(`p${paramIndex}`, sql.NVarChar, updateData.flow_name || '');
    }

    if (updateData.flow_desc !== undefined) {
      paramIndex++;
      updates.push(`flow_desc = @p${paramIndex}`);
      request.input(`p${paramIndex}`, sql.NVarChar, updateData.flow_desc || '');
    }

    if (updateData.status !== undefined) {
      paramIndex++;
      updates.push(`status = @p${paramIndex}`);
      request.input(`p${paramIndex}`, sql.NVarChar, updateData.status || 'draft');
    }

    if (updateData.is_default !== undefined) {
      paramIndex++;
      updates.push(`is_default = @p${paramIndex}`);
      request.input(`p${paramIndex}`, sql.Bit, updateData.is_default ? 1 : 0);
    }

    updates.push('updated_at = GETDATE()');
    request.input('flow_id', sql.Int, flowId);

    if (updates.length > 0) {
      await request.query(`
        UPDATE dbo.wf_flow_definition SET ${updates.join(', ')} WHERE flow_id = @flow_id
      `);
    }

    if (updateData.flow_config && typeof updateData.flow_config === 'object') {
      await createVersion(flowId, updateData.flow_config, updateData.change_desc || 'Updated flow config', updateData.created_by);
    }

    try {
      return await getFlowById(flowId);
    } catch (getErr) {
      console.warn('[updateFlow] getFlowById warning:', getErr.message);
      return {
        flow_id: flowId,
        status: 'updated',
        message: 'Flow updated but details retrieval failed'
      };
    }
  } catch (error) {
    console.error('[updateFlow] Error:', error);
    throw error;
  }
}

async function deleteFlow(flowId) {
  try {
    await ensureTables();
    const pool = await getPool();
    await pool.request()
      .input('flow_id', sql.Int, flowId)
      .query(`DELETE FROM dbo.wf_flow_definition WHERE flow_id = @flow_id`);
    return { success: true };
  } catch (error) {
    console.error('[deleteFlow] Error:', error);
    throw error;
  }
}

async function enableFlow(flowId) {
  try {
    await ensureTables();
    const pool = await getPool();
    await pool.request()
      .input('flow_id', sql.Int, flowId)
      .input('status', sql.NVarChar, FLOW_STATUS.ACTIVE)
      .query(`UPDATE dbo.wf_flow_definition SET status = @status, updated_at = GETDATE() WHERE flow_id = @flow_id`);
    return { success: true, status: FLOW_STATUS.ACTIVE };
  } catch (error) {
    console.error('[enableFlow] Error:', error);
    throw error;
  }
}

async function disableFlow(flowId) {
  try {
    await ensureTables();
    const pool = await getPool();
    await pool.request()
      .input('flow_id', sql.Int, flowId)
      .input('status', sql.NVarChar, FLOW_STATUS.DISABLED)
      .query(`UPDATE dbo.wf_flow_definition SET status = @status, updated_at = GETDATE() WHERE flow_id = @flow_id`);
    return { success: true, status: FLOW_STATUS.DISABLED };
  } catch (error) {
    console.error('[disableFlow] Error:', error);
    throw error;
  }
}

async function freezeFlow(flowId, reason = '') {
  try {
    await ensureTables();
    const pool = await getPool();
    await pool.request()
      .input('flow_id', sql.Int, flowId)
      .input('freeze_reason', sql.NVarChar, reason)
      .input('status', sql.NVarChar, 'frozen')
      .query(`UPDATE dbo.wf_flow_definition SET status = @status, flow_desc = ISNULL(flow_desc, '') + ' [冻结: ' + @freeze_reason + ']', updated_at = GETDATE() WHERE flow_id = @flow_id`);
    return { success: true, status: 'frozen' };
  } catch (error) {
    console.error('[freezeFlow] Error:', error);
    throw error;
  }
}

async function reactivateFlow(flowId) {
  try {
    await ensureTables();
    const pool = await getPool();
    await pool.request()
      .input('flow_id', sql.Int, flowId)
      .input('status', sql.NVarChar, FLOW_STATUS.ACTIVE)
      .query(`UPDATE dbo.wf_flow_definition SET status = @status, updated_at = GETDATE() WHERE flow_id = @flow_id`);
    return { success: true, status: FLOW_STATUS.ACTIVE };
  } catch (error) {
    console.error('[reactivateFlow] Error:', error);
    throw error;
  }
}

async function copyFlow(flowId, userId = null) {
  try {
    await ensureTables();
    const original = await getFlowById(flowId);
    if (!original) {
      throw new Error('Flow not found');
    }

    const pool = await getPool();
    const request = pool.request();

    const newFlowCode = `FLOW_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;
    const newFlowName = `${original.flow_name} (副本)`;

    request.input('flow_code', sql.NVarChar, newFlowCode);
    request.input('flow_name', sql.NVarChar, newFlowName);
    request.input('flow_desc', sql.NVarChar, original.flow_desc || null);
    request.input('module_code', sql.NVarChar, original.module_code || 'DEFAULT');
    request.input('is_default', sql.Bit, 0);
    request.input('status', sql.NVarChar, FLOW_STATUS.DRAFT);
    request.input('created_by', sql.Int, userId);

    const result = await request.query(`
      INSERT INTO dbo.wf_flow_definition
        (flow_code, flow_name, flow_desc, module_code, is_default, status, created_by)
      VALUES
        (@flow_code, @flow_name, @flow_desc, @module_code, @is_default, @status, @created_by);
      SELECT SCOPE_IDENTITY() as flow_id;
    `);

    const newFlowId = result.recordset[0].flow_id;

    if (original.current_config) {
      await createVersion(newFlowId, original.current_config, 'Copy from original', userId);
    }

    return await getFlowById(newFlowId);
  } catch (error) {
    console.error('[copyFlow] Error:', error);
    throw error;
  }
}

async function createBinding(flowId, moduleCode, isDefault = 0, priority = 0) {
  const pool = await getPool();
  const request = pool.request();

  request.input('flow_id', sql.Int, flowId);
  request.input('module_code', sql.NVarChar, moduleCode);
  request.input('is_default', sql.Bit, isDefault);
  request.input('priority', sql.Int, priority);

  await request.query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.wf_module_binding WHERE flow_id = @flow_id AND module_code = @module_code)
      INSERT INTO dbo.wf_module_binding (flow_id, module_code, is_default, priority) VALUES (@flow_id, @module_code, @is_default, @priority)
  `);
}

async function getBindingsByModule(moduleCode) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('module_code', sql.NVarChar, moduleCode)
    .query(`
      SELECT wmb.*, wfd.flow_name, wfd.flow_code
      FROM dbo.wf_module_binding wmb
      JOIN dbo.wf_flow_definition wfd ON wmb.flow_id = wfd.flow_id
      WHERE wmb.module_code = @module_code AND wfd.status = 'active'
      ORDER BY wmb.is_default DESC, wmb.priority DESC
    `);
  return result.recordset;
}

async function getFlowVersions(flowId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request()
    .input('flow_id', sql.Int, flowId)
    .query(`
      SELECT wfv.*, wu.name as created_by_name
      FROM dbo.wf_flow_version wfv
      LEFT JOIN dbo.sys_users wu ON wfv.created_by = wu.id
      WHERE wfv.flow_id = @flow_id
      ORDER BY wfv.version_number DESC
    `);
  return result.recordset;
}

async function rollbackToVersion(flowId, versionNumber) {
  const pool = await getPool();

  const versionResult = await pool.request()
    .input('flow_id', sql.Int, flowId)
    .input('version_number', sql.Int, versionNumber)
    .query(`
      SELECT * FROM dbo.wf_flow_version
      WHERE flow_id = @flow_id AND version_number = @version_number
    `);

  if (versionResult.recordset.length === 0) {
    throw new Error('Version not found');
  }

  const version = versionResult.recordset[0];
  const flowConfig = JSON.parse(version.flow_config);

  return createVersion(flowId, flowConfig, `Rollback to version ${versionNumber}`, null);
}

async function createApprovalGroup(groupData, userId) {
  const pool = await getPool();
  const request = pool.request();

  const groupCode = `GRP_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;

  request.input('group_code', sql.NVarChar, groupCode);
  request.input('group_name', sql.NVarChar, groupData.group_name);
  request.input('group_type', sql.NVarChar, groupData.group_type);
  request.input('member_ids', sql.NVarChar(sql.MAX), JSON.stringify(groupData.member_ids || []));
  request.input('member_roles', sql.NVarChar(sql.MAX), JSON.stringify(groupData.member_roles || []));
  request.input('created_by', sql.Int, userId);

  const result = await request.query(`
    INSERT INTO dbo.wf_approval_group
      (group_code, group_name, group_type, member_ids, member_roles, created_by)
    VALUES
      (@group_code, @group_name, @group_type, @member_ids, @member_roles, @created_by);
    SELECT SCOPE_IDENTITY() as group_id;
  `);

  return result.recordset[0].group_id;
}

async function getApprovalGroups(filters = {}) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT * FROM dbo.wf_approval_group ORDER BY created_at DESC
  `);
  return result.recordset.map(g => ({
    ...g,
    member_ids: JSON.parse(g.member_ids || '[]'),
    member_roles: JSON.parse(g.member_roles || '[]')
  }));
}

async function createNodeTemplate(templateData, userId) {
  const pool = await getPool();
  const request = pool.request();

  const templateCode = `TMPL_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;

  request.input('template_code', sql.NVarChar, templateCode);
  request.input('template_name', sql.NVarChar, templateData.template_name);
  request.input('node_type', sql.NVarChar, templateData.node_type);
  request.input('template_config', sql.NVarChar(sql.MAX), JSON.stringify(templateData.template_config));
  request.input('is_public', sql.Bit, templateData.is_public !== false);
  request.input('created_by', sql.Int, userId);

  const result = await request.query(`
    INSERT INTO dbo.wf_node_template
      (template_code, template_name, node_type, template_config, is_public, created_by)
    VALUES
      (@template_code, @template_name, @node_type, @template_config, @is_public, @created_by);
    SELECT SCOPE_IDENTITY() as template_id;
  `);

  return result.recordset[0].template_id;
}

async function getNodeTemplates(nodeType = null) {
  await ensureTables();
  const pool = await getPool();
  let query = 'SELECT * FROM dbo.wf_node_template WHERE 1=1';

  if (nodeType) {
    query += ` AND node_type = '${nodeType}'`;
  }

  const result = await pool.request().query(query + ' ORDER BY created_at DESC');
  return result.recordset.map(t => ({
    ...t,
    template_config: JSON.parse(t.template_config || '{}')
  }));
}

async function validateFlowConfig(flowConfig) {
  const errors = [];

  if (!flowConfig || typeof flowConfig !== 'object') {
    return errors;
  }

  if (!flowConfig.nodes || !Array.isArray(flowConfig.nodes)) {
    return errors;
  }

  if (flowConfig.nodes.length === 0) {
    return errors;
  }

  const startNodes = flowConfig.nodes.filter(n => n.is_start);
  if (startNodes.length === 0) {
    errors.push('Flow must have at least one start node');
  } else if (startNodes.length > 1) {
    errors.push('Flow must have only one start node');
  }

  const endNodes = flowConfig.nodes.filter(n => n.is_end);
  if (endNodes.length === 0) {
    errors.push('Flow must have at least one end node');
  }

  for (const node of flowConfig.nodes) {
    if (!node.node_name) {
      errors.push(`Node ${node.node_code || 'unknown'} must have a name`);
    }
    if (!node.node_type) {
      errors.push(`Node ${node.node_code || 'unknown'} must have a type`);
    }
    const validTypes = [
      NODE_TYPES.START, NODE_TYPES.END,
      NODE_TYPES.APPROVAL_SINGLE, NODE_TYPES.APPROVAL_MULTI,
      NODE_TYPES.CONDITION, NODE_TYPES.ACTION, NODE_TYPES.NOTIFY,
      NODE_TYPES.INITIATOR, NODE_TYPES.DEPT_MANAGER, NODE_TYPES.ROLE_APPROVAL,
      NODE_TYPES.CC, NODE_TYPES.COUNTERSIGN, NODE_TYPES.OR_SIGN,
      NODE_TYPES.AUTO_ACTION, NODE_TYPES.BRANCH_CONDITION,
      NODE_TYPES.REJECT_BRANCH, NODE_TYPES.TIMEOUT
    ];
    if (!validTypes.includes(node.node_type)) {
      errors.push(`Node ${node.node_code || node.node_name} has invalid type: ${node.node_type}`);
    }
  }

  return errors;
}

module.exports = {
  ensureTables,
  createFlow,
  getFlowById,
  getFlowByCode,
  getFlowList,
  updateFlow,
  deleteFlow,
  enableFlow,
  disableFlow,
  freezeFlow,
  reactivateFlow,
  copyFlow,
  createVersion,
  createNode,
  saveNodeConfig,
  saveApprovalRule,
  createBinding,
  getBindingsByModule,
  getFlowVersions,
  rollbackToVersion,
  createApprovalGroup,
  getApprovalGroups,
  createNodeTemplate,
  getNodeTemplates,
  validateFlowConfig,
  NODE_TYPES,
  NODE_TYPE_NAMES,
  FLOW_STATUS,
  RULE_TYPES
};