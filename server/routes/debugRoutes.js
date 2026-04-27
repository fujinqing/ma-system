const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// 返回 sales 相关表在当前数据库的 OBJECT_ID，便于调试表是否存在
router.get('/sales-tables', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        OBJECT_ID('dbo.price_calculations','U') as price_calculations_id,
        OBJECT_ID('dbo.quotations','U') as quotations_id,
        OBJECT_ID('dbo.sales_contracts','U') as sales_contracts_id,
        OBJECT_ID('dbo.contracts','U') as contracts_id
    `);
    res.json(res.formatResponse(true, result.recordset[0] || {}));
  } catch (err) {
    console.error('debug sales-tables failed:', err);
    res.status(500).json(res.formatResponse(false, null, 'debug查询失败'));
  }
});

module.exports = router;
