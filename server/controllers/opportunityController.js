const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const STAGE_MAP = {
  'initial_contact': '初步接洽',
  'requirements': '需求确认',
  'quotation': '方案报价',
  'technical_review': '技术评审',
  'business_negotiation': '商务谈判',
  'won': '成交',
  'lost': '丢单'
};

const getAllOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, salesId, stage, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    const pool = await getPool();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (customerId) {
      whereClause += ' AND o.customer_id = @customerId';
      params.push({ name: 'customerId', value: customerId });
    }
    if (salesId) {
      whereClause += ' AND o.sales_id = @salesId';
      params.push({ name: 'salesId', value: salesId });
    }
    if (stage) {
      whereClause += ' AND o.stage = @stage';
      params.push({ name: 'stage', value: stage });
    }
    if (status) {
      whereClause += ' AND o.status = @status';
      params.push({ name: 'status', value: status });
    }
    if (keyword) {
      whereClause += ' AND (o.name LIKE @keyword OR o.opportunity_code LIKE @keyword OR c.name LIKE @keyword)';
      params.push({ name: 'keyword', value: `%${keyword}%` });
    }

    const countRequest = pool.request();
    params.forEach(p => countRequest.input(p.name, p.value));

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM customer_opportunities o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `);

    const dataRequest = pool.request();
    params.forEach(p => dataRequest.input(p.name, p.value));
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('limit', sql.Int, parseInt(limit));

    const result = await dataRequest.query(`
      SELECT o.*, c.name as customer_name, c.code as customer_code,
             u.name as sales_name
      FROM customer_opportunities o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN sys_users u ON o.sales_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        opportunities: result.recordset,
        pagination: {
          total: countResult.recordset[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商机列表失败:', error);
    res.status(500).json({ success: false, message: '获取商机列表失败' });
  }
};

const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT o.*, c.name as customer_name, c.code as customer_code,
               u.name as sales_name, u.phone as sales_phone, u.email as sales_email
        FROM customer_opportunities o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN sys_users u ON o.sales_id = u.id
        WHERE o.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '商机不存在' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('获取商机详情失败:', error);
    res.status(500).json({ success: false, message: '获取商机详情失败' });
  }
};

const createOpportunity = async (req, res) => {
  try {
    const {
      name, customer_id, sales_id, contact_person, contact_phone, contact_email,
      stage, equipment_requirements, production_capacity, budget_amount,
      delivery_cycle, expected_signing_date, competitor_info,
      competitor_advantage, competitor_disadvantage, remarks, priority
    } = req.body;

    if (!name || !customer_id) {
      return res.status(400).json({ success: false, message: '商机名称和客户不能为空' });
    }

    const pool = await getPool();

    let newCode = 'OPP00000001';
    try {
      const maxCodeResult = await pool.request().query(`
        SELECT TOP 1 opportunity_code FROM customer_opportunities
        WHERE opportunity_code LIKE 'OPP%' ORDER BY opportunity_code DESC
      `);
      if (maxCodeResult.recordset.length > 0) {
        const maxCode = maxCodeResult.recordset[0].opportunity_code;
        const num = parseInt(maxCode.replace('OPP', '')) + 1;
        newCode = 'OPP' + num.toString().padStart(8, '0');
      }
    } catch (codeErr) {
      console.warn('生成商机编码失败，使用默认编码');
    }

    const stageName = STAGE_MAP[stage] || STAGE_MAP['initial_contact'];

    const result = await pool.request()
      .input('opportunity_code', sql.NVarChar, newCode)
      .input('name', sql.NVarChar, name)
      .input('customer_id', sql.Int, customer_id)
      .input('sales_id', sql.Int, sales_id || null)
      .input('contact_person', sql.NVarChar, contact_person || null)
      .input('contact_phone', sql.NVarChar, contact_phone || null)
      .input('contact_email', sql.NVarChar, contact_email || null)
      .input('stage', sql.NVarChar, stage || 'initial_contact')
      .input('stage_name', sql.NVarChar, stageName)
      .input('equipment_requirements', sql.NVarChar, equipment_requirements || null)
      .input('production_capacity', sql.NVarChar, production_capacity || null)
      .input('budget_amount', sql.Decimal(18,2), budget_amount ? parseFloat(budget_amount) : null)
      .input('delivery_cycle', sql.Int, delivery_cycle ? parseInt(delivery_cycle) : null)
      .input('expected_signing_date', sql.Date, expected_signing_date || null)
      .input('competitor_info', sql.NVarChar, competitor_info || null)
      .input('competitor_advantage', sql.NVarChar, competitor_advantage || null)
      .input('competitor_disadvantage', sql.NVarChar, competitor_disadvantage || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('created_by', sql.Int, req.user?.id || null)
      .query(`
        INSERT INTO customer_opportunities (
          opportunity_code, name, customer_id, sales_id, contact_person, contact_phone, contact_email,
          stage, stage_name, equipment_requirements, production_capacity, budget_amount,
          delivery_cycle, expected_signing_date, competitor_info, competitor_advantage,
          competitor_disadvantage, remarks, priority, created_by
        ) VALUES (
          @opportunity_code, @name, @customer_id, @sales_id, @contact_person, @contact_phone, @contact_email,
          @stage, @stage_name, @equipment_requirements, @production_capacity, @budget_amount,
          @delivery_cycle, @expected_signing_date, @competitor_info, @competitor_advantage,
          @competitor_disadvantage, @remarks, @priority, @created_by
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    const newId = result.recordset[0].id;

    try {
      await AuditLog.log('CREATE_OPPORTUNITY', req.user?.id, { opportunityId: newId, name }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({
      success: true,
      data: { id: newId, opportunity_code: newCode },
      message: '商机创建成功'
    });
  } catch (error) {
    console.error('创建商机失败:', error);
    res.status(500).json({ success: false, message: '创建商机失败' });
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, customer_id, sales_id, contact_person, contact_phone, contact_email,
      stage, equipment_requirements, production_capacity, budget_amount,
      delivery_cycle, expected_signing_date, competitor_info,
      competitor_advantage, competitor_disadvantage, lost_reason, lost_competitor,
      remarks, priority, status
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: '无效的商机ID' });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: '商机名称不能为空' });
    }

    const pool = await getPool();

    const stageName = STAGE_MAP[stage] || STAGE_MAP['initial_contact'];

    let updateStatus = status || 'active';
    if (stage === 'won') updateStatus = 'won';
    if (stage === 'lost') updateStatus = 'lost';

    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('customer_id', sql.Int, customer_id)
      .input('sales_id', sql.Int, sales_id || null)
      .input('contact_person', sql.NVarChar, contact_person || null)
      .input('contact_phone', sql.NVarChar, contact_phone || null)
      .input('contact_email', sql.NVarChar, contact_email || null)
      .input('stage', sql.NVarChar, stage || 'initial_contact')
      .input('stage_name', sql.NVarChar, stageName)
      .input('equipment_requirements', sql.NVarChar, equipment_requirements || null)
      .input('production_capacity', sql.NVarChar, production_capacity || null)
      .input('budget_amount', sql.Decimal(18,2), budget_amount ? parseFloat(budget_amount) : null)
      .input('delivery_cycle', sql.Int, delivery_cycle ? parseInt(delivery_cycle) : null)
      .input('expected_signing_date', sql.Date, expected_signing_date || null)
      .input('competitor_info', sql.NVarChar, competitor_info || null)
      .input('competitor_advantage', sql.NVarChar, competitor_advantage || null)
      .input('competitor_disadvantage', sql.NVarChar, competitor_disadvantage || null)
      .input('lost_reason', sql.NVarChar, lost_reason || null)
      .input('lost_competitor', sql.NVarChar, lost_competitor || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('status', sql.NVarChar, updateStatus)
      .input('updated_by', sql.Int, req.user?.id || null)
      .query(`
        UPDATE customer_opportunities SET
          name = @name,
          customer_id = @customer_id,
          sales_id = @sales_id,
          contact_person = @contact_person,
          contact_phone = @contact_phone,
          contact_email = @contact_email,
          stage = @stage,
          stage_name = @stage_name,
          equipment_requirements = @equipment_requirements,
          production_capacity = @production_capacity,
          budget_amount = @budget_amount,
          delivery_cycle = @delivery_cycle,
          expected_signing_date = @expected_signing_date,
          competitor_info = @competitor_info,
          competitor_advantage = @competitor_advantage,
          competitor_disadvantage = @competitor_disadvantage,
          lost_reason = @lost_reason,
          lost_competitor = @lost_competitor,
          remarks = @remarks,
          priority = @priority,
          status = @status,
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM customer_opportunities WHERE id = @id');

    try {
      await AuditLog.log('UPDATE_OPPORTUNITY', req.user?.id, { opportunityId: id }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({ success: true, data: result.recordset[0], message: '商机更新成功' });
  } catch (error) {
    console.error('更新商机失败:', error);
    res.status(500).json({ success: false, message: '更新商机失败' });
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: '无效的商机ID' });
    }

    const pool = await getPool();

    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM customer_opportunities WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '商机不存在' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM customer_opportunities WHERE id = @id');

    try {
      await AuditLog.log('DELETE_OPPORTUNITY', req.user?.id, { opportunityId: id }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({ success: true, message: '商机删除成功' });
  } catch (error) {
    console.error('删除商机失败:', error);
    res.status(500).json({ success: false, message: '删除商机失败' });
  }
};

const changeOpportunityStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, lost_reason, lost_competitor } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: '无效的商机ID' });
    }

    if (!stage) {
      return res.status(400).json({ success: false, message: '阶段不能为空' });
    }

    const pool = await getPool();
    const stageName = STAGE_MAP[stage] || stage;

    let updateStatus = 'active';
    if (stage === 'won') updateStatus = 'won';
    if (stage === 'lost') updateStatus = 'lost';

    await pool.request()
      .input('id', sql.Int, id)
      .input('stage', sql.NVarChar, stage)
      .input('stage_name', sql.NVarChar, stageName)
      .input('status', sql.NVarChar, updateStatus)
      .input('lost_reason', sql.NVarChar, lost_reason || null)
      .input('lost_competitor', sql.NVarChar, lost_competitor || null)
      .input('updated_by', sql.Int, req.user?.id || null)
      .query(`
        UPDATE customer_opportunities SET
          stage = @stage,
          stage_name = @stage_name,
          status = @status,
          lost_reason = @lost_reason,
          lost_competitor = @lost_competitor,
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);

    try {
      await AuditLog.log('CHANGE_OPPORTUNITY_STAGE', req.user?.id, { opportunityId: id, newStage: stage }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    res.json({ success: true, message: `商机阶段已更新为${stageName}` });
  } catch (error) {
    console.error('变更商机阶段失败:', error);
    res.status(500).json({ success: false, message: '变更商机阶段失败' });
  }
};

const getOpportunityStatistics = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as totalOpportunities,
        SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END) as wonCount,
        SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END) as lostCount,
        SUM(CASE WHEN stage NOT IN ('won', 'lost') THEN 1 ELSE 0 END) as inProgressCount,
        SUM(CASE WHEN stage = 'initial_contact' THEN 1 ELSE 0 END) as initialContactCount,
        SUM(CASE WHEN stage = 'requirements' THEN 1 ELSE 0 END) as requirementsCount,
        SUM(CASE WHEN stage = 'quotation' THEN 1 ELSE 0 END) as quotationCount,
        SUM(CASE WHEN stage = 'technical_review' THEN 1 ELSE 0 END) as technicalReviewCount,
        SUM(CASE WHEN stage = 'business_negotiation' THEN 1 ELSE 0 END) as businessNegotiationCount,
        SUM(ISNULL(budget_amount, 0)) as totalBudget,
        SUM(CASE WHEN stage = 'won' THEN ISNULL(budget_amount, 0) ELSE 0 END) as wonBudget,
        SUM(CASE WHEN stage = 'lost' THEN ISNULL(budget_amount, 0) ELSE 0 END) as lostBudget
      FROM customer_opportunities
      WHERE status != 'deleted'
    `);

    const stats = result.recordset[0];
    const totalClosed = stats.wonCount + stats.lostCount;
    const winRate = totalClosed > 0
      ? ((stats.wonCount / totalClosed) * 100).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        ...stats,
        winRate: parseFloat(winRate)
      }
    });
  } catch (error) {
    console.error('获取商机统计失败:', error);
    res.status(500).json({ success: false, message: '获取商机统计失败' });
  }
};

module.exports = {
  getAllOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  changeOpportunityStage,
  getOpportunityStatistics
};
