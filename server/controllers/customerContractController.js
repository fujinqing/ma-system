const sql = require('mssql');
const { getPool } = require('../config/database');

const getAllContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    const pool = await getPool();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (customerId) {
      whereClause += ' AND c.customer_id = @customerId';
      params.push({ name: 'customerId', value: customerId });
    }
    if (status) {
      whereClause += ' AND c.contract_status = @status';
      params.push({ name: 'status', value: status });
    }
    if (keyword) {
      whereClause += ' AND (c.contract_name LIKE @keyword OR c.contract_code LIKE @keyword OR ct.name LIKE @keyword)';
      params.push({ name: 'keyword', value: `%${keyword}%` });
    }

    const countRequest = pool.request();
    params.forEach(p => countRequest.input(p.name, p.value));
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM customer_contracts c
      LEFT JOIN customers ct ON c.customer_id = ct.id
      ${whereClause}
    `);

    const dataRequest = pool.request();
    params.forEach(p => dataRequest.input(p.name, p.value));
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('limit', sql.Int, parseInt(limit));

    const result = await dataRequest.query(`
      SELECT c.*, ct.name as customer_name, ct.code as customer_code,
             u.name as sales_name
      FROM customer_contracts c
      LEFT JOIN customers ct ON c.customer_id = ct.id
      LEFT JOIN sys_users u ON c.sales_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        contracts: result.recordset,
        pagination: {
          total: countResult.recordset[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取合同列表失败:', error);
    res.status(500).json({ success: false, message: '获取合同列表失败' });
  }
};

const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT c.*, ct.name as customer_name, ct.code as customer_code,
               u.name as sales_name
        FROM customer_contracts c
        LEFT JOIN customers ct ON c.customer_id = ct.id
        LEFT JOIN sys_users u ON c.sales_id = u.id
        WHERE c.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    const contract = result.recordset[0];

    const plansResult = await pool.request()
      .input('contractId', sql.Int, id)
      .query(`SELECT * FROM contract_payment_plans WHERE contract_id = @contractId ORDER BY plan_no`);

    const recordsResult = await pool.request()
      .input('contractId', sql.Int, id)
      .query(`SELECT * FROM contract_payment_records WHERE contract_id = @contractId ORDER BY payment_date DESC`);

    contract.payment_plans = plansResult.recordset;
    contract.payment_records = recordsResult.recordset;

    res.json({ success: true, data: contract });
  } catch (error) {
    console.error('获取合同详情失败:', error);
    res.status(500).json({ success: false, message: '获取合同详情失败' });
  }
};

const createContract = async (req, res) => {
  try {
    const {
      contract_name, customer_id, opportunity_id, sales_id,
      contract_amount, signing_date, start_date, end_date,
      payment_terms, delivery_conditions, quality_guarantee_period,
      remarks
    } = req.body;

    if (!contract_name || !customer_id) {
      return res.status(400).json({ success: false, message: '合同名称和客户不能为空' });
    }

    const pool = await getPool();

    let newCode = 'CCTR' + Date.now().toString().slice(-8);

    const result = await pool.request()
      .input('contract_code', sql.NVarChar, newCode)
      .input('contract_name', sql.NVarChar, contract_name)
      .input('customer_id', sql.Int, customer_id)
      .input('opportunity_id', sql.Int, opportunity_id || null)
      .input('sales_id', sql.Int, sales_id || null)
      .input('contract_amount', sql.Decimal(18,2), contract_amount || 0)
      .input('signing_date', sql.Date, signing_date || null)
      .input('start_date', sql.Date, start_date || null)
      .input('end_date', sql.Date, end_date || null)
      .input('payment_terms', sql.NVarChar, payment_terms || null)
      .input('delivery_conditions', sql.NVarChar, delivery_conditions || null)
      .input('quality_guarantee_period', sql.Int, quality_guarantee_period || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('created_by', sql.Int, req.user?.id || null)
      .query(`
        INSERT INTO customer_contracts
        (contract_code, contract_name, customer_id, opportunity_id, sales_id,
         contract_amount, signing_date, start_date, end_date,
         payment_terms, delivery_conditions, quality_guarantee_period,
         remarks, created_by)
        VALUES
        (@contract_code, @contract_name, @customer_id, @opportunity_id, @sales_id,
         @contract_amount, @signing_date, @start_date, @end_date,
         @payment_terms, @delivery_conditions, @quality_guarantee_period,
         @remarks, @created_by);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const contractId = result.recordset[0].id;

    res.json({
      success: true,
      data: { id: contractId, contract_code: newCode },
      message: '合同创建成功'
    });
  } catch (error) {
    console.error('创建合同失败:', error);
    res.status(500).json({ success: false, message: '创建合同失败' });
  }
};

const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contract_name, customer_id, opportunity_id, sales_id,
      contract_amount, signing_date, start_date, end_date,
      contract_status, payment_status,
      payment_terms, delivery_conditions, quality_guarantee_period,
      remarks
    } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('contract_name', sql.NVarChar, contract_name)
      .input('customer_id', sql.Int, customer_id)
      .input('opportunity_id', sql.Int, opportunity_id || null)
      .input('sales_id', sql.Int, sales_id || null)
      .input('contract_amount', sql.Decimal(18,2), contract_amount || 0)
      .input('signing_date', sql.Date, signing_date || null)
      .input('start_date', sql.Date, start_date || null)
      .input('end_date', sql.Date, end_date || null)
      .input('contract_status', sql.NVarChar, contract_status || null)
      .input('payment_status', sql.NVarChar, payment_status || null)
      .input('payment_terms', sql.NVarChar, payment_terms || null)
      .input('delivery_conditions', sql.NVarChar, delivery_conditions || null)
      .input('quality_guarantee_period', sql.Int, quality_guarantee_period || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('updated_by', sql.Int, req.user?.id || null)
      .query(`
        UPDATE customer_contracts SET
          contract_name = @contract_name,
          customer_id = @customer_id,
          opportunity_id = @opportunity_id,
          sales_id = @sales_id,
          contract_amount = @contract_amount,
          signing_date = @signing_date,
          start_date = @start_date,
          end_date = @end_date,
          contract_status = @contract_status,
          payment_status = @payment_status,
          payment_terms = @payment_terms,
          delivery_conditions = @delivery_conditions,
          quality_guarantee_period = @quality_guarantee_period,
          remarks = @remarks,
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);

    res.json({ success: true, message: '合同更新成功' });
  } catch (error) {
    console.error('更新合同失败:', error);
    res.status(500).json({ success: false, message: '更新合同失败' });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM contract_payment_records WHERE contract_id = @id`);

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM contract_payment_plans WHERE contract_id = @id`);

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM customer_contracts WHERE id = @id`);

    res.json({ success: true, message: '合同删除成功' });
  } catch (error) {
    console.error('删除合同失败:', error);
    res.status(500).json({ success: false, message: '删除合同失败' });
  }
};

const getContractStatistics = async (req, res) => {
  try {
    const pool = await getPool();

    const totalResult = await pool.request().query(`
      SELECT
        COUNT(*) as total_contracts,
        SUM(contract_amount) as total_amount,
        SUM(received_amount) as total_received,
        SUM(unpaid_amount) as total_unpaid
      FROM customer_contracts
    `);

    const statusResult = await pool.request().query(`
      SELECT contract_status, COUNT(*) as count, SUM(contract_amount) as amount
      FROM customer_contracts
      GROUP BY contract_status
    `);

    const expiringResult = await pool.request().query(`
      SELECT COUNT(*) as expiring_count
      FROM customer_contracts
      WHERE contract_status = 'active'
        AND end_date IS NOT NULL
        AND DATEDIFF(DAY, GETDATE(), end_date) BETWEEN 0 AND 90
    `);

    const unpaidResult = await pool.request().query(`
      SELECT COUNT(*) as unpaid_count, SUM(unpaid_amount) as unpaid_amount
      FROM customer_contracts
      WHERE payment_status = 'unpaid' OR payment_status = 'partial'
    `);

    res.json({
      success: true,
      data: {
        totalContracts: totalResult.recordset[0].total_contracts || 0,
        totalAmount: totalResult.recordset[0].total_amount || 0,
        totalReceived: totalResult.recordset[0].total_received || 0,
        totalUnpaid: totalResult.recordset[0].total_unpaid || 0,
        statusDistribution: statusResult.recordset,
        expiringContracts: expiringResult.recordset[0].expiring_count || 0,
        unpaidContracts: unpaidResult.recordset[0].unpaid_count || 0,
        unpaidAmount: unpaidResult.recordset[0].unpaid_amount || 0
      }
    });
  } catch (error) {
    console.error('获取合同统计失败:', error);
    res.status(500).json({ success: false, message: '获取合同统计失败' });
  }
};

const addPaymentPlan = async (req, res) => {
  try {
    const { contract_id, plan_no, plan_amount, plan_date, payment_type, payment_method, remarks } = req.body;

    if (!contract_id || !plan_no || !plan_amount || !plan_date) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('contract_id', sql.Int, contract_id)
      .input('plan_no', sql.Int, plan_no)
      .input('plan_amount', sql.Decimal(18,2), plan_amount)
      .input('plan_date', sql.Date, plan_date)
      .input('payment_type', sql.NVarChar, payment_type || null)
      .input('payment_method', sql.NVarChar, payment_method || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO contract_payment_plans
        (contract_id, plan_no, plan_amount, plan_date, payment_type, payment_method, remarks)
        VALUES (@contract_id, @plan_no, @plan_amount, @plan_date, @payment_type, @payment_method, @remarks);
        SELECT SCOPE_IDENTITY() as id;
      `);

    res.json({ success: true, data: { id: result.recordset[0].id }, message: '回款计划添加成功' });
  } catch (error) {
    console.error('添加回款计划失败:', error);
    res.status(500).json({ success: false, message: '添加回款计划失败' });
  }
};

const addPaymentRecord = async (req, res) => {
  try {
    const { contract_id, plan_id, payment_amount, payment_date, payment_method, payment_type, invoice_no, remarks } = req.body;

    if (!contract_id || !payment_amount || !payment_date) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('contract_id', sql.Int, contract_id)
      .input('plan_id', sql.Int, plan_id || null)
      .input('payment_amount', sql.Decimal(18,2), payment_amount)
      .input('payment_date', sql.Date, payment_date)
      .input('payment_method', sql.NVarChar, payment_method || null)
      .input('payment_type', sql.NVarChar, payment_type || null)
      .input('invoice_no', sql.NVarChar, invoice_no || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO contract_payment_records
        (contract_id, plan_id, payment_amount, payment_date, payment_method, payment_type, invoice_no, remarks)
        VALUES (@contract_id, @plan_id, @payment_amount, @payment_date, @payment_method, @payment_type, @invoice_no, @remarks);
        SELECT SCOPE_IDENTITY() as id;
      `);

    if (plan_id) {
      await pool.request()
        .input('planId', sql.Int, plan_id)
        .input('amount', sql.Decimal(18,2), payment_amount)
        .query(`UPDATE contract_payment_plans SET received_amount = received_amount + @amount, plan_status = 'paid' WHERE id = @planId`);
    }

    await pool.request()
      .input('contractId', sql.Int, contract_id)
      .query(`
        UPDATE customer_contracts SET
          received_amount = (SELECT SUM(payment_amount) FROM contract_payment_records WHERE contract_id = @contractId),
          unpaid_amount = contract_amount - (SELECT SUM(payment_amount) FROM contract_payment_records WHERE contract_id = @contractId),
          payment_status = CASE
            WHEN contract_amount <= (SELECT SUM(payment_amount) FROM contract_payment_records WHERE contract_id = @contractId) THEN 'paid'
            WHEN (SELECT SUM(payment_amount) FROM contract_payment_records WHERE contract_id = @contractId) > 0 THEN 'partial'
            ELSE payment_status
          END
        WHERE id = @contractId
      `);

    res.json({ success: true, data: { id: result.recordset[0].id }, message: '回款记录添加成功' });
  } catch (error) {
    console.error('添加回款记录失败:', error);
    res.status(500).json({ success: false, message: '添加回款记录失败' });
  }
};

const getContractsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('customerId', sql.Int, customerId)
      .query(`
        SELECT * FROM customer_contracts
        WHERE customer_id = @customerId
        ORDER BY created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('获取客户合同失败:', error);
    res.status(500).json({ success: false, message: '获取客户合同失败' });
  }
};

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getContractStatistics,
  addPaymentPlan,
  addPaymentRecord,
  getContractsByCustomer
};
