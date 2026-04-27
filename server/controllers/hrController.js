const express = require('express');
const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const router = express.Router();

const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', department = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = await getPool();
    let countQuery = `
      SELECT COUNT(*) as total FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    let dataQuery = `
      SELECT u.*, d.name as department_name
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      countQuery += ' AND (u.name LIKE @keyword OR CAST(u.employee_no AS NVARCHAR(50)) LIKE @keyword OR u.phone LIKE @keyword)';
      dataQuery += ' AND (u.name LIKE @keyword OR CAST(u.employee_no AS NVARCHAR(50)) LIKE @keyword OR u.phone LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (department) {
      countQuery += ' AND d.name = @department';
      dataQuery += ' AND d.name = @department';
      params.push({ name: 'department', type: sql.NVarChar, value: department });
    }
    if (status) {
      countQuery += ' AND u.status = @status';
      dataQuery += ' AND u.status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    dataQuery += ` ORDER BY u.updated_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    const list = result.recordset.map(user => ({
      ...user,
      employee_code: user.employee_no,
      department: user.department_name
    }));

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total
        }
      }
    });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({ success: false, message: '获取员工列表失败' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.*, d.name as department_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE u.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const user = result.recordset[0];
    const employee = {
      ...user,
      employee_code: user.employee_no,
      department: user.department_name
    };

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('获取员工详情失败:', error);
    res.status(500).json({ success: false, message: '获取员工详情失败' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, phone, email, department_id, position, status, role
    } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('department_id', sql.Int, department_id)
      .input('position', sql.NVarChar, position)
      .input('status', sql.NVarChar, status)
      .input('role', sql.NVarChar, role)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_users SET
          name = @name,
          phone = @phone,
          email = @email,
          department_id = @department_id,
          position = @position,
          status = @status,
          role = @role,
          updated_by = @updated_by,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    await AuditLog.log('UPDATE_EMPLOYEE', req.user?.id, { employeeId: id }, req);

    res.json({ success: true, message: '员工更新成功' });
  } catch (error) {
    console.error('更新员工失败:', error);
    res.status(500).json({ success: false, message: '更新员工失败' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_users SET
          status = 'terminated',
          updated_by = @updated_by,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    await AuditLog.log('DELETE_EMPLOYEE', req.user?.id, { employeeId: id }, req);

    res.json({ success: true, message: '员工删除成功' });
  } catch (error) {
    console.error('删除员工失败:', error);
    res.status(500).json({ success: false, message: '删除员工失败' });
  }
};

router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

module.exports = {
  router,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};