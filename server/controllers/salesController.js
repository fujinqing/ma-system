const sql = require('mssql');
const { getPool } = require('../config/database');

/**
 * 获取销售仪表盘数据
 */
const getSalesDashboard = async (req, res) => {
  try {
    const pool = await getPool();

    // 先检查相关表是否存在，避免在单个 SQL 中引用不存在的对象导致编译错误
    const checkResult = await pool.request().query(`
      SELECT
        OBJECT_ID('dbo.price_calculations','U') as price_calculations_exists,
        OBJECT_ID('dbo.quotations','U') as quotations_exists,
        OBJECT_ID('dbo.sales_contracts','U') as sales_contracts_exists,
        OBJECT_ID('dbo.contracts','U') as contracts_exists
    `);

    const exists = checkResult.recordset[0] || {};
    console.log('salesController.getSalesDashboard - table existence:', exists);

    // 基础统计：客户总数
    const custRes = await pool.request().query(`SELECT COUNT(*) as cnt FROM customers`);
    const potentialCustomers = (custRes.recordset[0] && custRes.recordset[0].cnt) || 0;

    // 按需查询可能的表
    let priceCalculationCount = 0;
    if (exists.price_calculations_exists) {
      console.log('salesController.getSalesDashboard - querying price_calculations');
      const r = await pool.request().query(`SELECT COUNT(*) as cnt FROM price_calculations WHERE status IN ('processing','completed')`);
      priceCalculationCount = (r.recordset[0] && r.recordset[0].cnt) || 0;
    }

    let quotationCount = 0;
    if (exists.quotations_exists) {
      console.log('salesController.getSalesDashboard - querying quotations');
      const r = await pool.request().query(`SELECT COUNT(*) as cnt FROM quotations WHERE status IN ('processing','approved')`);
      quotationCount = (r.recordset[0] && r.recordset[0].cnt) || 0;
    }

    let signedProjects = 0;
    let totalSales = 0;
    if (exists.sales_contracts_exists) {
      console.log('salesController.getSalesDashboard - querying sales_contracts');
      // 先检查列是否存在，避免引用不存在列导致 SQL 编译错误
      const colCheck = await pool.request().query(`
        SELECT 1 as has_col FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='sales_contracts' AND COLUMN_NAME='total_amount'
      `);
      const hasTotalCol = (colCheck.recordset && colCheck.recordset.length > 0);
      if (hasTotalCol) {
        try {
          const r = await pool.request().query(`SELECT COUNT(*) as cnt, ISNULL(SUM(total_amount),0) as total FROM sales_contracts WHERE status = 'signed'`);
          signedProjects = (r.recordset[0] && r.recordset[0].cnt) || 0;
          totalSales = (r.recordset[0] && r.recordset[0].total) || 0;
        } catch (e) {
          console.warn('salesController.sales_contracts SUM(total_amount) failed, falling back to count only', e.message || e);
          const r2 = await pool.request().query(`SELECT COUNT(*) as cnt FROM sales_contracts WHERE status = 'signed'`);
          signedProjects = (r2.recordset[0] && r2.recordset[0].cnt) || 0;
          totalSales = 0;
        }
      } else {
        const r2 = await pool.request().query(`SELECT COUNT(*) as cnt FROM sales_contracts WHERE status = 'signed'`);
        signedProjects = (r2.recordset[0] && r2.recordset[0].cnt) || 0;
        totalSales = 0;
      }
    } else if (exists.contracts_exists) {
      console.log('salesController.getSalesDashboard - querying contracts');
      const colCheck2 = await pool.request().query(`
        SELECT 1 as has_col FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='contracts' AND COLUMN_NAME='total_amount'
      `);
      const hasTotalCol2 = (colCheck2.recordset && colCheck2.recordset.length > 0);
      if (hasTotalCol2) {
        try {
          const r = await pool.request().query(`SELECT COUNT(*) as cnt, ISNULL(SUM(total_amount),0) as total FROM contracts WHERE status = 'signed'`);
          signedProjects = (r.recordset[0] && r.recordset[0].cnt) || 0;
          totalSales = (r.recordset[0] && r.recordset[0].total) || 0;
        } catch (e) {
          console.warn('salesController.contracts SUM(total_amount) failed, falling back to count only', e.message || e);
          const r2 = await pool.request().query(`SELECT COUNT(*) as cnt FROM contracts WHERE status = 'signed'`);
          signedProjects = (r2.recordset[0] && r2.recordset[0].cnt) || 0;
          totalSales = 0;
        }
      } else {
        const r2 = await pool.request().query(`SELECT COUNT(*) as cnt FROM contracts WHERE status = 'signed'`);
        signedProjects = (r2.recordset[0] && r2.recordset[0].cnt) || 0;
        totalSales = 0;
      }
    }

    const quoteStageProjects = priceCalculationCount + quotationCount;

    res.json(res.formatResponse(true, {
      potentialCustomers,
      quoteStageProjects,
      signedProjects,
      totalSales: `¥${(totalSales / 10000).toFixed(0)}万`
    }));
  } catch (error) {
    console.error('获取销售仪表盘数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取销售仪表盘数据失败'));
  }
};

/**
 * 获取价格计算表数据
 */
const getPriceCalculations = async (req, res) => {
  try {
    const pool = await getPool();

    // 使用动态 SQL：若表不存在，不会在编译期引用 price_calculations，从而避免 SQL 编译错误
    const sql = `
      IF OBJECT_ID('dbo.price_calculations','U') IS NULL
      BEGIN
        -- 返回空结果集
        SELECT TOP 0 NULL as __empty__;
      END
      ELSE
      BEGIN
        EXEC sp_executesql N'
          SELECT pc.*, p.project_name, c.name as customer_name, u.name as sales_name
          FROM dbo.price_calculations pc
          LEFT JOIN dbo.projects p ON pc.project_id = p.id
          LEFT JOIN dbo.customers c ON p.customer_id = c.id
          LEFT JOIN dbo.users u ON pc.sales_id = u.id
          ORDER BY pc.created_at DESC
        ';
      END
    `;

    const result = await pool.request().query(sql);
    const rows = result.recordset || [];
    // 如果表不存在，rows 将为空数组；若存在则为查询结果
    return res.json(res.formatResponse(true, rows));
  } catch (error) {
    console.error('获取价格计算表数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取价格计算表数据失败'));
  }
};

/**
 * 获取报价单数据
 */
const getQuotations = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        q.*, 
        p.project_name, 
        c.name as customer_name,
        u.name as sales_name
      FROM quotations q
      LEFT JOIN projects p ON q.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON q.sales_id = u.id
      ORDER BY q.created_at DESC
    `);
    
    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取报价单数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取报价单数据失败'));
  }
};

/**
 * 获取招投标项目数据
 */
const getBiddingProjects = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        b.*, 
        p.project_name, 
        c.name as customer_name,
        u.name as sales_name
      FROM bidding_projects b
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON b.sales_id = u.id
      ORDER BY b.created_at DESC
    `);
    
    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取招投标项目数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取招投标项目数据失败'));
  }
};

/**
 * 获取合同数据
 */
const getContracts = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        co.*, 
        p.project_name, 
        c.name as customer_name,
        u.name as sales_name
      FROM contracts co
      LEFT JOIN projects p ON co.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON co.sales_id = u.id
      ORDER BY co.created_at DESC
    `);
    
    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取合同数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取合同数据失败'));
  }
};

/**
 * 获取回款记录数据
 */
const getPaymentRecords = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        pr.*, 
        co.contract_number, 
        co.project_id,
        p.project_name, 
        c.name as customer_name,
        u.name as sales_name
      FROM payment_records pr
      LEFT JOIN contracts co ON pr.contract_id = co.id
      LEFT JOIN projects p ON co.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON pr.sales_id = u.id
      ORDER BY pr.payment_date DESC
    `);
    
    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取回款记录数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取回款记录数据失败'));
  }
};

module.exports = {
  getSalesDashboard,
  getPriceCalculations,
  getQuotations,
  getBiddingProjects,
  getContracts,
  getPaymentRecords
};
