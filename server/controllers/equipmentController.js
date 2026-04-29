const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const getAllEquipment = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    const pool = await getPool();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (customerId) {
      whereClause += ' AND e.customer_id = @customerId';
      params.push({ name: 'customerId', value: customerId });
    }
    if (status) {
      whereClause += ' AND e.equipment_status = @status';
      params.push({ name: 'status', value: status });
    }
    if (keyword) {
      whereClause += ' AND (e.equipment_name LIKE @keyword OR e.equipment_code LIKE @keyword OR e.serial_number LIKE @keyword)';
      params.push({ name: 'keyword', value: `%${keyword}%` });
    }

    const countRequest = pool.request();
    params.forEach(p => countRequest.input(p.name, p.value));

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM customer_equipment e
      ${whereClause}
    `);

    const dataRequest = pool.request();
    params.forEach(p => dataRequest.input(p.name, p.value));
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('limit', sql.Int, parseInt(limit));

    const result = await dataRequest.query(`
      SELECT e.*, c.name as customer_name, c.code as customer_code
      FROM customer_equipment e
      LEFT JOIN customers c ON e.customer_id = c.id
      ${whereClause}
      ORDER BY e.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        equipment: result.recordset,
        pagination: {
          total: countResult.recordset[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({ success: false, message: '获取设备列表失败' });
  }
};

const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT e.*, c.name as customer_name, c.code as customer_code
        FROM customer_equipment e
        LEFT JOIN customers c ON e.customer_id = c.id
        WHERE e.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    res.status(500).json({ success: false, message: '获取设备详情失败' });
  }
};

const createEquipment = async (req, res) => {
  try {
    const {
      equipment_name, customer_id, equipment_model, equipment_specs,
      serial_number, manufacture_date, installation_date, warranty_expire_date,
      equipment_status, equipment_location, production_line, remarks
    } = req.body;

    if (!equipment_name || !customer_id) {
      return res.status(400).json({ success: false, message: '设备名称和客户不能为空' });
    }

    const pool = await getPool();

    let newCode = 'EQP' + Date.now().toString().slice(-8);
    try {
      const maxCodeResult = await pool.request().query(`
        SELECT TOP 1 equipment_code FROM customer_equipment WHERE equipment_code LIKE 'EQP%' ORDER BY equipment_code DESC
      `);
      if (maxCodeResult.recordset.length > 0) {
        const maxCode = maxCodeResult.recordset[0].equipment_code;
        const num = parseInt(maxCode.replace('EQP', '')) + 1;
        newCode = 'EQP' + num.toString().padStart(8, '0');
      }
    } catch (codeErr) {
      console.warn('生成设备编码失败，使用时间戳编码');
    }

    const result = await pool.request()
      .input('equipment_code', sql.NVarChar, newCode)
      .input('equipment_name', sql.NVarChar, equipment_name)
      .input('customer_id', sql.Int, customer_id)
      .input('equipment_model', sql.NVarChar, equipment_model || null)
      .input('equipment_specs', sql.NVarChar, equipment_specs || null)
      .input('serial_number', sql.NVarChar, serial_number || null)
      .input('manufacture_date', sql.Date, manufacture_date || null)
      .input('installation_date', sql.Date, installation_date || null)
      .input('warranty_expire_date', sql.Date, warranty_expire_date || null)
      .input('equipment_status', sql.NVarChar, equipment_status || 'normal')
      .input('equipment_location', sql.NVarChar, equipment_location || null)
      .input('production_line', sql.NVarChar, production_line || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('created_by', sql.Int, req.user?.id || null)
      .query(`
        INSERT INTO customer_equipment (
          equipment_code, equipment_name, customer_id, equipment_model, equipment_specs,
          serial_number, manufacture_date, installation_date, warranty_expire_date,
          equipment_status, equipment_location, production_line, remarks, created_by
        ) VALUES (
          @equipment_code, @equipment_name, @customer_id, @equipment_model, @equipment_specs,
          @serial_number, @manufacture_date, @installation_date, @warranty_expire_date,
          @equipment_status, @equipment_location, @production_line, @remarks, @created_by
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    const newId = result.recordset[0].id;

    try {
      await AuditLog.log('CREATE_EQUIPMENT', req.user?.id, { equipmentId: newId, equipmentCode: newCode }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({
      success: true,
      data: { id: newId, equipment_code: newCode },
      message: '设备创建成功'
    });
  } catch (error) {
    console.error('创建设备失败:', error);
    res.status(500).json({ success: false, message: '创建设备失败' });
  }
};

const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      equipment_name, customer_id, equipment_model, equipment_specs,
      serial_number, manufacture_date, installation_date, warranty_expire_date,
      equipment_status, equipment_location, production_line, remarks
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: '无效的设备ID' });
    }

    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('equipment_name', sql.NVarChar, equipment_name)
      .input('customer_id', sql.Int, customer_id)
      .input('equipment_model', sql.NVarChar, equipment_model || null)
      .input('equipment_specs', sql.NVarChar, equipment_specs || null)
      .input('serial_number', sql.NVarChar, serial_number || null)
      .input('manufacture_date', sql.Date, manufacture_date || null)
      .input('installation_date', sql.Date, installation_date || null)
      .input('warranty_expire_date', sql.Date, warranty_expire_date || null)
      .input('equipment_status', sql.NVarChar, equipment_status || 'normal')
      .input('equipment_location', sql.NVarChar, equipment_location || null)
      .input('production_line', sql.NVarChar, production_line || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('updated_by', sql.Int, req.user?.id || null)
      .query(`
        UPDATE customer_equipment SET
          equipment_name = @equipment_name,
          customer_id = @customer_id,
          equipment_model = @equipment_model,
          equipment_specs = @equipment_specs,
          serial_number = @serial_number,
          manufacture_date = @manufacture_date,
          installation_date = @installation_date,
          warranty_expire_date = @warranty_expire_date,
          equipment_status = @equipment_status,
          equipment_location = @equipment_location,
          production_line = @production_line,
          remarks = @remarks,
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);

    try {
      await AuditLog.log('UPDATE_EQUIPMENT', req.user?.id, { equipmentId: id }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({ success: true, message: '设备更新成功' });
  } catch (error) {
    console.error('更新设备失败:', error);
    res.status(500).json({ success: false, message: '更新设备失败' });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: '无效的设备ID' });
    }

    const pool = await getPool();

    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM customer_equipment WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM customer_equipment WHERE id = @id');

    try {
      await AuditLog.log('DELETE_EQUIPMENT', req.user?.id, { equipmentId: id }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({ success: true, message: '设备删除成功' });
  } catch (error) {
    console.error('删除设备失败:', error);
    res.status(500).json({ success: false, message: '删除设备失败' });
  }
};

const getEquipmentMaintenanceRecords = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query(`
        SELECT m.*, e.name as engineer_name
        FROM equipment_maintenance_records m
        LEFT JOIN sys_users e ON m.engineer_id = e.id
        WHERE m.equipment_id = @equipmentId
        ORDER BY m.maintenance_date DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('获取维保记录失败:', error);
    res.status(500).json({ success: false, message: '获取维保记录失败' });
  }
};

const createMaintenanceRecord = async (req, res) => {
  try {
    const { equipment_id, maintenance_type, maintenance_date, engineer_id,
      maintenance_content, parts_replaced, maintenance_hours, cost,
      next_maintenance_date, customer_feedback } = req.body;

    if (!equipment_id || !maintenance_type || !maintenance_date) {
      return res.status(400).json({ success: false, message: '设备ID、维保类型和日期不能为空' });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .input('maintenance_type', sql.NVarChar, maintenance_type)
      .input('maintenance_date', sql.DateTime, maintenance_date)
      .input('engineer_id', sql.Int, engineer_id || null)
      .input('maintenance_content', sql.NVarChar, maintenance_content || null)
      .input('parts_replaced', sql.NVarChar, parts_replaced || null)
      .input('maintenance_hours', sql.Decimal(10,2), maintenance_hours ? parseFloat(maintenance_hours) : null)
      .input('cost', sql.Decimal(18,2), cost ? parseFloat(cost) : null)
      .input('next_maintenance_date', sql.Date, next_maintenance_date || null)
      .input('customer_feedback', sql.NVarChar, customer_feedback || null)
      .input('created_by', sql.Int, req.user?.id || null)
      .query(`
        INSERT INTO equipment_maintenance_records (
          equipment_id, maintenance_type, maintenance_date, engineer_id,
          maintenance_content, parts_replaced, maintenance_hours, cost,
          next_maintenance_date, customer_feedback, created_by
        ) VALUES (
          @equipment_id, @maintenance_type, @maintenance_date, @engineer_id,
          @maintenance_content, @parts_replaced, @maintenance_hours, @cost,
          @next_maintenance_date, @customer_feedback, @created_by
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    res.json({
      success: true,
      data: { id: result.recordset[0].id },
      message: '维保记录创建成功'
    });
  } catch (error) {
    console.error('创建维保记录失败:', error);
    res.status(500).json({ success: false, message: '创建维保记录失败' });
  }
};

const getRepairRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, equipmentId, status } = req.query;
    const offset = (page - 1) * limit;
    const pool = await getPool();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (equipmentId) {
      whereClause += ' AND r.equipment_id = @equipmentId';
      params.push({ name: 'equipmentId', value: equipmentId });
    }
    if (status) {
      whereClause += ' AND r.status = @status';
      params.push({ name: 'status', value: status });
    }

    const dataRequest = pool.request();
    params.forEach(p => dataRequest.input(p.name, p.value));
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('limit', sql.Int, parseInt(limit));

    const result = await dataRequest.query(`
      SELECT r.*, e.equipment_name, e.serial_number,
             c.name as customer_name,
             eng.name as engineer_name
      FROM equipment_repair_requests r
      LEFT JOIN customer_equipment e ON r.equipment_id = e.id
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN sys_users eng ON r.assigned_engineer_id = eng.id
      ${whereClause}
      ORDER BY r.request_date DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM equipment_repair_requests r ${whereClause}
    `);

    res.json({
      success: true,
      data: {
        repairs: result.recordset,
        pagination: {
          total: countResult.recordset[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取报修记录失败:', error);
    res.status(500).json({ success: false, message: '获取报修记录失败' });
  }
};

const createRepairRequest = async (req, res) => {
  try {
    const { equipment_id, reporter_name, reporter_phone, fault_description, priority } = req.body;

    if (!equipment_id || !fault_description) {
      return res.status(400).json({ success: false, message: '设备和故障描述不能为空' });
    }

    const pool = await getPool();

    let newNo = 'REP' + Date.now().toString().slice(-8);

    const result = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .input('request_no', sql.NVarChar, newNo)
      .input('reporter_name', sql.NVarChar, reporter_name || null)
      .input('reporter_phone', sql.NVarChar, reporter_phone || null)
      .input('fault_description', sql.NVarChar, fault_description)
      .input('priority', sql.NVarChar, priority || 'normal')
      .query(`
        INSERT INTO equipment_repair_requests (
          equipment_id, request_no, reporter_name, reporter_phone,
          fault_description, priority
        ) VALUES (
          @equipment_id, @request_no, @reporter_name, @reporter_phone,
          @fault_description, @priority
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    res.json({
      success: true,
      data: { id: result.recordset[0].id, request_no: newNo },
      message: '报修单创建成功'
    });
  } catch (error) {
    console.error('创建报修单失败:', error);
    res.status(500).json({ success: false, message: '创建报修单失败' });
  }
};

const getEquipmentStatistics = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as totalEquipment,
        SUM(CASE WHEN equipment_status = 'normal' THEN 1 ELSE 0 END) as normalCount,
        SUM(CASE WHEN equipment_status = 'running' THEN 1 ELSE 0 END) as runningCount,
        SUM(CASE WHEN equipment_status = 'maintenance' THEN 1 ELSE 0 END) as maintenanceCount,
        SUM(CASE WHEN equipment_status = 'broken' THEN 1 ELSE 0 END) as brokenCount,
        SUM(CASE WHEN warranty_expire_date IS NOT NULL AND warranty_expire_date < DATEADD(day, 30, GETDATE()) THEN 1 ELSE 0 END) as warrantyExpiringCount
      FROM customer_equipment
    `);

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('获取设备统计失败:', error);
    res.status(500).json({ success: false, message: '获取设备统计失败' });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentMaintenanceRecords,
  createMaintenanceRecord,
  getRepairRequests,
  createRepairRequest,
  getEquipmentStatistics
};
