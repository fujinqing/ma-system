const db = require('../config/database');

// 主数据控制器：提供集中主数据 API（客户/用户/供应商/物料等）
const getCustomers = async (req, res) => {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query(`SELECT id, code, name, short_name, status, customer_type FROM customers`);
    res.json(res.formatResponse(true, result.recordset));
  } catch (err) {
    console.error('获取主数据-客户失败:', err);
    res.status(500).json(res.formatResponse(false, null, '获取主数据-客户失败'));
  }
};

const getUsers = async (req, res) => {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query(`SELECT id, employee_no, name, role, department_id FROM sys_users`);
    res.json(res.formatResponse(true, result.recordset));
  } catch (err) {
    console.error('获取主数据-用户失败:', err);
    res.status(500).json(res.formatResponse(false, null, '获取主数据-用户失败'));
  }
};

const getSuppliers = async (req, res) => {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query(`SELECT id, code, name, status FROM suppliers`);
    res.json(res.formatResponse(true, result.recordset));
  } catch (err) {
    console.error('获取主数据-供应商失败:', err);
    res.status(500).json(res.formatResponse(false, null, '获取主数据-供应商失败'));
  }
};

const getMasterCustomers = async (req, res) => {
  try {
    const pool = await db.getPool();
    const existsRes = await pool.request().query(`SELECT OBJECT_ID('dbo.md_customers','U') as exists`);
    if (!existsRes.recordset[0] || !existsRes.recordset[0].exists) {
      return res.json(res.formatResponse(true, []));
    }
    const r = await pool.request().query(`SELECT * FROM md_customers ORDER BY updated_at DESC`);
    res.json(res.formatResponse(true, r.recordset));
  } catch (err) {
    console.error('获取主数据-主索引客户失败:', err);
    res.status(500).json(res.formatResponse(false, null, '获取主数据-主索引客户失败'));
  }
};

module.exports = {
  getCustomers,
  getUsers,
  getSuppliers
  ,getMasterCustomers
};
