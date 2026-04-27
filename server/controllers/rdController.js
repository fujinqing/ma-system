const express = require('express');
const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const router = express.Router();

const generateCode = async (pool, prefix, tableName, columnName) => {
  const result = await pool.request().query(`
    SELECT TOP 1 ${columnName} FROM ${tableName} WHERE ${columnName} IS NOT NULL ORDER BY ${columnName} DESC
  `);
  let newCode = prefix + '00001';
  if (result.recordset.length > 0) {
    const maxCode = result.recordset[0][columnName];
    const num = parseInt(maxCode.replace(prefix, '')) + 1;
    newCode = prefix + num.toString().padStart(5, '0');
  }
  return newCode;
};

const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', project_type = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM rd_projects WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (project_name LIKE @keyword OR project_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (project_type) {
      query += ' AND project_type = @project_type';
      params.push({ name: 'project_type', type: sql.NVarChar, value: project_type });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM rd_projects WHERE 1=1
        ${keyword ? "AND (project_name LIKE @keyword OR project_code LIKE @keyword)" : ''}
        ${project_type ? 'AND project_type = @project_type' : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取研发项目列表失败:', error);
    res.status(500).json({ success: false, message: '获取研发项目列表失败' });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      project_name, project_type, category, customer_code, priority, budget,
      start_date, planned_end_date, project_manager, department, location,
      description, target_specs, risk_level, remarks
    } = req.body;

    const pool = await getPool();
    const project_code = await generateCode(pool, 'RD_PROJ_', 'rd_projects', 'project_code');

    const result = await pool.request()
      .input('project_code', sql.NVarChar, project_code)
      .input('project_name', sql.NVarChar, project_name)
      .input('project_type', sql.NVarChar, project_type)
      .input('category', sql.NVarChar, category)
      .input('customer_code', sql.NVarChar, customer_code)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('budget', sql.Decimal(12, 2), budget ? parseFloat(budget) : null)
      .input('start_date', sql.Date, start_date)
      .input('planned_end_date', sql.Date, planned_end_date)
      .input('project_manager', sql.NVarChar, project_manager)
      .input('department', sql.NVarChar, department)
      .input('location', sql.NVarChar, location)
      .input('description', sql.NVarChar, description)
      .input('target_specs', sql.NVarChar, target_specs)
      .input('risk_level', sql.NVarChar, risk_level)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO rd_projects (
          project_code, project_name, project_type, category, customer_code, priority,
          budget, start_date, planned_end_date, project_manager, department, location,
          description, target_specs, risk_level, remarks
        ) VALUES (
          @project_code, @project_name, @project_type, @category, @customer_code, @priority,
          @budget, @start_date, @planned_end_date, @project_manager, @department, @location,
          @description, @target_specs, @risk_level, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_RD_PROJECT', req.user?.id, { projectId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, project_code }, message: '研发项目创建成功' });
  } catch (error) {
    console.error('创建研发项目失败:', error);
    res.status(500).json({ success: false, message: '创建研发项目失败' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_name, project_type, category, customer_code, priority, budget, cost,
      start_date, planned_end_date, actual_end_date, progress_percent, status,
      project_manager, department, location, description, target_specs, risk_level, remarks
    } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('project_name', sql.NVarChar, project_name)
      .input('project_type', sql.NVarChar, project_type)
      .input('category', sql.NVarChar, category)
      .input('customer_code', sql.NVarChar, customer_code)
      .input('priority', sql.NVarChar, priority)
      .input('budget', sql.Decimal(12, 2), budget ? parseFloat(budget) : null)
      .input('cost', sql.Decimal(12, 2), cost ? parseFloat(cost) : null)
      .input('start_date', sql.Date, start_date)
      .input('planned_end_date', sql.Date, planned_end_date)
      .input('actual_end_date', sql.Date, actual_end_date)
      .input('progress_percent', sql.Decimal(5, 1), progress_percent ? parseFloat(progress_percent) : 0)
      .input('status', sql.NVarChar, status)
      .input('project_manager', sql.NVarChar, project_manager)
      .input('department', sql.NVarChar, department)
      .input('location', sql.NVarChar, location)
      .input('description', sql.NVarChar, description)
      .input('target_specs', sql.NVarChar, target_specs)
      .input('risk_level', sql.NVarChar, risk_level)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE rd_projects SET
          project_name = @project_name, project_type = @project_type, category = @category,
          customer_code = @customer_code, priority = @priority, budget = @budget, cost = @cost,
          start_date = @start_date, planned_end_date = @planned_end_date, actual_end_date = @actual_end_date,
          progress_percent = @progress_percent, status = @status, project_manager = @project_manager,
          department = @department, location = @location, description = @description,
          target_specs = @target_specs, risk_level = @risk_level, remarks = @remarks,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    await AuditLog.log('UPDATE_RD_PROJECT', req.user?.id, { projectId: id }, req);
    res.json({ success: true, message: '研发项目更新成功' });
  } catch (error) {
    console.error('更新研发项目失败:', error);
    res.status(500).json({ success: false, message: '更新研发项目失败' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', project_code = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM rd_tasks WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (task_name LIKE @keyword OR task_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (project_code) {
      query += ' AND project_code = @project_code';
      params.push({ name: 'project_code', type: sql.NVarChar, value: project_code });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM rd_tasks WHERE 1=1
        ${keyword ? "AND (task_name LIKE @keyword OR task_code LIKE @keyword)" : ''}
        ${project_code ? 'AND project_code = @project_code' : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取研发任务列表失败:', error);
    res.status(500).json({ success: false, message: '获取研发任务列表失败' });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      project_code, phase_code, task_name, task_type, description, assigned_to,
      estimated_hours, start_date, due_date, priority, dependency_tasks, remarks
    } = req.body;

    const pool = await getPool();
    const task_code = await generateCode(pool, 'RD_TASK_', 'rd_tasks', 'task_code');

    const result = await pool.request()
      .input('task_code', sql.NVarChar, task_code)
      .input('project_code', sql.NVarChar, project_code)
      .input('phase_code', sql.NVarChar, phase_code)
      .input('task_name', sql.NVarChar, task_name)
      .input('task_type', sql.NVarChar, task_type)
      .input('description', sql.NVarChar, description)
      .input('assigned_to', sql.NVarChar, assigned_to)
      .input('estimated_hours', sql.Decimal(6, 1), estimated_hours ? parseFloat(estimated_hours) : null)
      .input('start_date', sql.Date, start_date)
      .input('due_date', sql.Date, due_date)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('dependency_tasks', sql.NVarChar, dependency_tasks)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO rd_tasks (
          task_code, project_code, phase_code, task_name, task_type, description,
          assigned_to, estimated_hours, start_date, due_date, priority, dependency_tasks, remarks
        ) VALUES (
          @task_code, @project_code, @phase_code, @task_name, @task_type, @description,
          @assigned_to, @estimated_hours, @start_date, @due_date, @priority, @dependency_tasks, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_RD_TASK', req.user?.id, { taskId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, task_code }, message: '研发任务创建成功' });
  } catch (error) {
    console.error('创建研发任务失败:', error);
    res.status(500).json({ success: false, message: '创建研发任务失败' });
  }
};

const getAllPrototypes = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', project_code = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM rd_prototypes WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (prototype_name LIKE @keyword OR prototype_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (project_code) {
      query += ' AND project_code = @project_code';
      params.push({ name: 'project_code', type: sql.NVarChar, value: project_code });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM rd_prototypes WHERE 1=1
        ${keyword ? "AND (prototype_name LIKE @keyword OR prototype_code LIKE @keyword)" : ''}
        ${project_code ? 'AND project_code = @project_code' : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取试制记录列表失败:', error);
    res.status(500).json({ success: false, message: '获取试制记录列表失败' });
  }
};

const createPrototype = async (req, res) => {
  try {
    const {
      project_code, prototype_name, prototype_type, version, quantity,
      build_start_date, build_end_date, test_start_date, test_end_date,
      responsible, test_location, cost, remarks
    } = req.body;

    const pool = await getPool();
    const prototype_code = await generateCode(pool, 'RD_PROT_', 'rd_prototypes', 'prototype_code');

    const result = await pool.request()
      .input('prototype_code', sql.NVarChar, prototype_code)
      .input('project_code', sql.NVarChar, project_code)
      .input('prototype_name', sql.NVarChar, prototype_name)
      .input('prototype_type', sql.NVarChar, prototype_type)
      .input('version', sql.NVarChar, version)
      .input('quantity', sql.Int, quantity || 1)
      .input('build_start_date', sql.Date, build_start_date)
      .input('build_end_date', sql.Date, build_end_date)
      .input('test_start_date', sql.Date, test_start_date)
      .input('test_end_date', sql.Date, test_end_date)
      .input('responsible', sql.NVarChar, responsible)
      .input('test_location', sql.NVarChar, test_location)
      .input('cost', sql.Decimal(12, 2), cost ? parseFloat(cost) : null)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO rd_prototypes (
          prototype_code, project_code, prototype_name, prototype_type, version, quantity,
          build_start_date, build_end_date, test_start_date, test_end_date,
          responsible, test_location, cost, remarks
        ) VALUES (
          @prototype_code, @project_code, @prototype_name, @prototype_type, @version, @quantity,
          @build_start_date, @build_end_date, @test_start_date, @test_end_date,
          @responsible, @test_location, @cost, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_RD_PROTOTYPE', req.user?.id, { prototypeId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, prototype_code }, message: '试制记录创建成功' });
  } catch (error) {
    console.error('创建试制记录失败:', error);
    res.status(500).json({ success: false, message: '创建试制记录失败' });
  }
};

const getAllIssues = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', project_code = '', severity = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM rd_issues WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (issue_title LIKE @keyword OR issue_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (project_code) {
      query += ' AND project_code = @project_code';
      params.push({ name: 'project_code', type: sql.NVarChar, value: project_code });
    }
    if (severity) {
      query += ' AND severity = @severity';
      params.push({ name: 'severity', type: sql.NVarChar, value: severity });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM rd_issues WHERE 1=1
        ${keyword ? "AND (issue_title LIKE @keyword OR issue_code LIKE @keyword)" : ''}
        ${project_code ? 'AND project_code = @project_code' : ''}
        ${severity ? 'AND severity = @severity' : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取问题跟踪列表失败:', error);
    res.status(500).json({ success: false, message: '获取问题跟踪列表失败' });
  }
};

const createIssue = async (req, res) => {
  try {
    const {
      project_code, task_code, prototype_code, issue_title, issue_type,
      severity, priority, reported_by, reported_date, assigned_to, due_date, remarks
    } = req.body;

    const pool = await getPool();
    const issue_code = await generateCode(pool, 'RD_ISSUE_', 'rd_issues', 'issue_code');

    const result = await pool.request()
      .input('issue_code', sql.NVarChar, issue_code)
      .input('project_code', sql.NVarChar, project_code)
      .input('task_code', sql.NVarChar, task_code)
      .input('prototype_code', sql.NVarChar, prototype_code)
      .input('issue_title', sql.NVarChar, issue_title)
      .input('issue_type', sql.NVarChar, issue_type)
      .input('severity', sql.NVarChar, severity || 'minor')
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('reported_by', sql.NVarChar, reported_by)
      .input('reported_date', sql.Date, reported_date || new Date())
      .input('assigned_to', sql.NVarChar, assigned_to)
      .input('due_date', sql.Date, due_date)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO rd_issues (
          issue_code, project_code, task_code, prototype_code, issue_title, issue_type,
          severity, priority, reported_by, reported_date, assigned_to, due_date, remarks
        ) VALUES (
          @issue_code, @project_code, @task_code, @prototype_code, @issue_title, @issue_type,
          @severity, @priority, @reported_by, @reported_date, @assigned_to, @due_date, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_RD_ISSUE', req.user?.id, { issueId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, issue_code }, message: '问题创建成功' });
  } catch (error) {
    console.error('创建问题失败:', error);
    res.status(500).json({ success: false, message: '创建问题失败' });
  }
};

router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.get('/tasks', getAllTasks);
router.post('/tasks', createTask);
router.get('/prototypes', getAllPrototypes);
router.post('/prototypes', createPrototype);
router.get('/issues', getAllIssues);
router.post('/issues', createIssue);

module.exports = {
  router,
  getAllProjects,
  createProject,
  updateProject,
  getAllTasks,
  createTask,
  getAllPrototypes,
  createPrototype,
  getAllIssues,
  createIssue
};