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

const getAllWorkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = '', priority = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM mfg_work_orders WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (work_order_code LIKE @keyword OR order_name LIKE @keyword OR product_name LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    if (priority) {
      query += ' AND priority = @priority';
      params.push({ name: 'priority', type: sql.NVarChar, value: priority });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM mfg_work_orders WHERE 1=1
        ${keyword ? "AND (work_order_code LIKE @keyword OR order_name LIKE @keyword OR product_name LIKE @keyword)" : ''}
        ${status ? 'AND status = @status' : ''}
        ${priority ? 'AND priority = @priority' : ''}
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
    console.error('获取工单列表失败:', error);
    res.status(500).json({ success: false, message: '获取工单列表失败' });
  }
};

const createWorkOrder = async (req, res) => {
  try {
    const {
      order_name, product_name, product_model, quantity, unit, priority,
      planned_start_date, planned_end_date, workshop, production_line, supervisor,
      customer_code, project_code, bom_code, remarks
    } = req.body;

    const pool = await getPool();
    const work_order_code = await generateCode(pool, 'MFG_WO_', 'mfg_work_orders', 'work_order_code');

    const result = await pool.request()
      .input('work_order_code', sql.NVarChar, work_order_code)
      .input('order_name', sql.NVarChar, order_name)
      .input('product_name', sql.NVarChar, product_name)
      .input('product_model', sql.NVarChar, product_model)
      .input('quantity', sql.Int, quantity ? parseInt(quantity) : 0)
      .input('unit', sql.NVarChar, unit || '台')
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('planned_start_date', sql.Date, planned_start_date)
      .input('planned_end_date', sql.Date, planned_end_date)
      .input('workshop', sql.NVarChar, workshop)
      .input('production_line', sql.NVarChar, production_line)
      .input('supervisor', sql.NVarChar, supervisor)
      .input('customer_code', sql.NVarChar, customer_code)
      .input('project_code', sql.NVarChar, project_code)
      .input('bom_code', sql.NVarChar, bom_code)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO mfg_work_orders (
          work_order_code, order_name, product_name, product_model, quantity, unit, priority,
          planned_start_date, planned_end_date, workshop, production_line, supervisor,
          customer_code, project_code, bom_code, remarks
        ) VALUES (
          @work_order_code, @order_name, @product_name, @product_model, @quantity, @unit, @priority,
          @planned_start_date, @planned_end_date, @workshop, @production_line, @supervisor,
          @customer_code, @project_code, @bom_code, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_WORK_ORDER', req.user?.id, { workOrderId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, work_order_code }, message: '工单创建成功' });
  } catch (error) {
    console.error('创建工单失败:', error);
    res.status(500).json({ success: false, message: '创建工单失败' });
  }
};

const updateWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_name, product_name, product_model, quantity, unit, priority,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date,
      progress_percent, status, workshop, production_line, supervisor, remarks
    } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('order_name', sql.NVarChar, order_name)
      .input('product_name', sql.NVarChar, product_name)
      .input('product_model', sql.NVarChar, product_model)
      .input('quantity', sql.Int, quantity ? parseInt(quantity) : 0)
      .input('unit', sql.NVarChar, unit)
      .input('priority', sql.NVarChar, priority)
      .input('planned_start_date', sql.Date, planned_start_date)
      .input('planned_end_date', sql.Date, planned_end_date)
      .input('actual_start_date', sql.Date, actual_start_date)
      .input('actual_end_date', sql.Date, actual_end_date)
      .input('progress_percent', sql.Decimal(5, 1), progress_percent ? parseFloat(progress_percent) : 0)
      .input('status', sql.NVarChar, status)
      .input('workshop', sql.NVarChar, workshop)
      .input('production_line', sql.NVarChar, production_line)
      .input('supervisor', sql.NVarChar, supervisor)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE mfg_work_orders SET
          order_name = @order_name, product_name = @product_name, product_model = @product_model,
          quantity = @quantity, unit = @unit, priority = @priority,
          planned_start_date = @planned_start_date, planned_end_date = @planned_end_date,
          actual_start_date = @actual_start_date, actual_end_date = @actual_end_date,
          progress_percent = @progress_percent, status = @status, workshop = @workshop,
          production_line = @production_line, supervisor = @supervisor, remarks = @remarks,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    await AuditLog.log('UPDATE_WORK_ORDER', req.user?.id, { workOrderId: id }, req);
    res.json({ success: true, message: '工单更新成功' });
  } catch (error) {
    console.error('更新工单失败:', error);
    res.status(500).json({ success: false, message: '更新工单失败' });
  }
};

const getAllEquipment = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = '', equipment_type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM mfg_equipment WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (equipment_name LIKE @keyword OR equipment_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    if (equipment_type) {
      query += ' AND equipment_type = @equipment_type';
      params.push({ name: 'equipment_type', type: sql.NVarChar, value: equipment_type });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM mfg_equipment WHERE 1=1
        ${keyword ? "AND (equipment_name LIKE @keyword OR equipment_code LIKE @keyword)" : ''}
        ${status ? 'AND status = @status' : ''}
        ${equipment_type ? 'AND equipment_type = @equipment_type' : ''}
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
    console.error('获取设备列表失败:', error);
    res.status(500).json({ success: false, message: '获取设备列表失败' });
  }
};

const createEquipment = async (req, res) => {
  try {
    const {
      equipment_name, equipment_type, brand, model, serial_number, location,
      workshop, purchase_date, purchase_price, useful_life_years, status, supplier, remarks
    } = req.body;

    const pool = await getPool();
    const equipment_code = await generateCode(pool, 'MFG_EQP_', 'mfg_equipment', 'equipment_code');

    const result = await pool.request()
      .input('equipment_code', sql.NVarChar, equipment_code)
      .input('equipment_name', sql.NVarChar, equipment_name)
      .input('equipment_type', sql.NVarChar, equipment_type)
      .input('brand', sql.NVarChar, brand)
      .input('model', sql.NVarChar, model)
      .input('serial_number', sql.NVarChar, serial_number)
      .input('location', sql.NVarChar, location)
      .input('workshop', sql.NVarChar, workshop)
      .input('purchase_date', sql.Date, purchase_date)
      .input('purchase_price', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('useful_life_years', sql.Int, useful_life_years ? parseInt(useful_life_years) : null)
      .input('depreciation_rate', sql.Decimal(4, 2), useful_life_years ? 1.0 / parseInt(useful_life_years) : null)
      .input('current_value', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('status', sql.NVarChar, status || 'operating')
      .input('supplier', sql.NVarChar, supplier)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO mfg_equipment (
          equipment_code, equipment_name, equipment_type, brand, model, serial_number,
          location, workshop, purchase_date, purchase_price, useful_life_years,
          depreciation_rate, current_value, status, supplier, remarks
        ) VALUES (
          @equipment_code, @equipment_name, @equipment_type, @brand, @model, @serial_number,
          @location, @workshop, @purchase_date, @purchase_price, @useful_life_years,
          @depreciation_rate, @current_value, @status, @supplier, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_EQUIPMENT', req.user?.id, { equipmentId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, equipment_code }, message: '设备创建成功' });
  } catch (error) {
    console.error('创建设备失败:', error);
    res.status(500).json({ success: false, message: '创建设备失败' });
  }
};

const getAllReporting = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', work_order_code = '', reporting_date = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM mfg_reporting WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (reporting_code LIKE @keyword OR employee_code LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (work_order_code) {
      query += ' AND work_order_code = @work_order_code';
      params.push({ name: 'work_order_code', type: sql.NVarChar, value: work_order_code });
    }
    if (reporting_date) {
      query += ' AND reporting_date = @reporting_date';
      params.push({ name: 'reporting_date', type: sql.Date, value: reporting_date });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY reporting_date DESC) as RowNum
        FROM mfg_reporting WHERE 1=1
        ${keyword ? "AND (reporting_code LIKE @keyword OR employee_code LIKE @keyword)" : ''}
        ${work_order_code ? 'AND work_order_code = @work_order_code' : ''}
        ${reporting_date ? 'AND reporting_date = @reporting_date' : ''}
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
    console.error('获取报工列表失败:', error);
    res.status(500).json({ success: false, message: '获取报工列表失败' });
  }
};

const createReporting = async (req, res) => {
  try {
    const {
      work_order_code, process_code, employee_code, reporting_date, quantity_completed,
      qualified_quantity, rejected_quantity, labor_hours, machine_hours, overtime_hours,
      material_lot, equipment_code, quality_status, remarks
    } = req.body;

    const pool = await getPool();
    const reporting_code = await generateCode(pool, 'MFG_REP_', 'mfg_reporting', 'reporting_code');

    const result = await pool.request()
      .input('reporting_code', sql.NVarChar, reporting_code)
      .input('work_order_code', sql.NVarChar, work_order_code)
      .input('process_code', sql.NVarChar, process_code)
      .input('employee_code', sql.NVarChar, employee_code)
      .input('reporting_date', sql.Date, reporting_date)
      .input('quantity_completed', sql.Int, quantity_completed ? parseInt(quantity_completed) : 0)
      .input('qualified_quantity', sql.Int, qualified_quantity ? parseInt(qualified_quantity) : 0)
      .input('rejected_quantity', sql.Int, rejected_quantity ? parseInt(rejected_quantity) : 0)
      .input('labor_hours', sql.Decimal(6, 1), labor_hours ? parseFloat(labor_hours) : null)
      .input('machine_hours', sql.Decimal(6, 1), machine_hours ? parseFloat(machine_hours) : null)
      .input('overtime_hours', sql.Decimal(4, 1), overtime_hours ? parseFloat(overtime_hours) : null)
      .input('material_lot', sql.NVarChar, material_lot)
      .input('equipment_code', sql.NVarChar, equipment_code)
      .input('quality_status', sql.NVarChar, quality_status || 'pending')
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO mfg_reporting (
          reporting_code, work_order_code, process_code, employee_code, reporting_date,
          quantity_completed, qualified_quantity, rejected_quantity, labor_hours, machine_hours,
          overtime_hours, material_lot, equipment_code, quality_status, remarks
        ) VALUES (
          @reporting_code, @work_order_code, @process_code, @employee_code, @reporting_date,
          @quantity_completed, @qualified_quantity, @rejected_quantity, @labor_hours, @machine_hours,
          @overtime_hours, @material_lot, @equipment_code, @quality_status, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_REPORTING', req.user?.id, { reportingId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, reporting_code }, message: '报工创建成功' });
  } catch (error) {
    console.error('创建报工失败:', error);
    res.status(500).json({ success: false, message: '创建报工失败' });
  }
};

router.get('/work-orders', getAllWorkOrders);
router.post('/work-orders', createWorkOrder);
router.put('/work-orders/:id', updateWorkOrder);
router.get('/equipment', getAllEquipment);
router.post('/equipment', createEquipment);
router.get('/reporting', getAllReporting);
router.post('/reporting', createReporting);

module.exports = {
  router,
  getAllWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  getAllEquipment,
  createEquipment,
  getAllReporting,
  createReporting
};