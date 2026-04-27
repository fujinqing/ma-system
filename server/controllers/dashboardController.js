const sql = require('mssql');
const { getPool } = require('../config/database');
// const mockData = require('../mockData');

const getStats = async (req, res) => {
  try {
    const pool = await getPool();
    
    // 查询客户总数
    const customerCount = await pool.request().query('SELECT COUNT(*) as count FROM customers');
    
    // 查询进行中项目数
    const projectResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM projects WHERE status = '进行中'
    `);
    
    // 查询待审批单据数
    const pendingApprovals = await pool.request().query(`
      SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'
    `);
    
    // 查询本月销售额
    const quotationResult = await pool.request().query(`
      SELECT ISNULL(SUM(total_amount), 0) as total FROM quotations 
      WHERE MONTH(created_at) = MONTH(GETDATE()) AND YEAR(created_at) = YEAR(GETDATE())
    `);

    // 构建统计数据
    const stats = {
      customerCount: customerCount.recordset[0].count,
      projectCount: projectResult.recordset[0].count,
      salesAmount: `¥${(quotationResult.recordset[0].total / 10000).toFixed(0)}万`,
      pendingApprovals: pendingApprovals.recordset[0].count
    };

    res.json(res.formatResponse(true, stats));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取统计数据失败'));
  }
};

module.exports = {
  getStats
};
