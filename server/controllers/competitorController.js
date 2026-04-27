const sql = require('mssql');
const { getPool } = require('../config/database');

// 格式化响应
exports.formatResponse = (success, data, message = '') => {
  return {
    success,
    data,
    message
  };
};

// 获取竞争对手列表
exports.getCompetitors = async (req, res) => {
  try {
    const pool = await getPool();
    const { page = 1, limit = 20, keyword, industry, strength } = req.query;
    
    let query = `
      SELECT * FROM competitors
      WHERE 1=1
    `;
    const params = [];
    
    if (keyword) {
      query += ` AND (name LIKE @keyword OR company LIKE @keyword)`;
      params.push({ name: 'keyword', value: `%${keyword}%` });
    }
    
    if (industry) {
      query += ` AND industry = @industry`;
      params.push({ name: 'industry', value: industry });
    }
    
    if (strength) {
      query += ` AND strength = @strength`;
      params.push({ name: 'strength', value: strength });
    }
    
    // 计算总数
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as temp`;
    const countResult = await pool.request().input('keyword', sql.NVarChar, keyword ? `%${keyword}%` : '').input('industry', sql.NVarChar, industry).input('strength', sql.NVarChar, strength).query(countQuery);
    const total = countResult.recordset[0].total;
    
    // 分页 - 使用传统的ROW_NUMBER()方式
    const offset = (page - 1) * limit;
    const pageSize = parseInt(limit);
    const pageNum = parseInt(page);
    
    // 构建带分页的查询
    const paginatedQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS RowNum
        FROM competitors
        WHERE 1=1
        ${keyword ? "AND (name LIKE @keyword OR company LIKE @keyword)" : ""}
        ${industry ? "AND industry = @industry" : ""}
        ${strength ? "AND strength = @strength" : ""}
      ) AS TempTable
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;
    
    const request = pool.request();
    if (keyword) request.input('keyword', sql.NVarChar, `%${keyword}%`);
    if (industry) request.input('industry', sql.NVarChar, industry);
    if (strength) request.input('strength', sql.NVarChar, strength);
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);
    
    const result = await request.query(paginatedQuery);
    
    res.json(exports.formatResponse(true, {
      competitors: result.recordset,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    console.error('获取竞争对手列表失败:', error);
    res.status(500).json(exports.formatResponse(false, null, '获取竞争对手列表失败'));
  }
};

// 获取单个竞争对手详情
exports.getCompetitor = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM competitors WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json(exports.formatResponse(false, null, '竞争对手不存在'));
    }
    
    res.json(exports.formatResponse(true, result.recordset[0]));
  } catch (error) {
    console.error('获取竞争对手详情失败:', error);
    res.status(500).json(exports.formatResponse(false, null, '获取竞争对手详情失败'));
  }
};

// 创建竞争对手
exports.createCompetitor = async (req, res) => {
  try {
    const pool = await getPool();
    const { name, company, industry, strength, market_share, founded_date, key_products, core_advantages, disadvantages, market_strategy, contact_info, remarks } = req.body;
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('company', sql.NVarChar, company)
      .input('industry', sql.NVarChar, industry)
      .input('strength', sql.NVarChar, strength)
      .input('market_share', sql.Decimal, market_share)
      .input('founded_date', sql.Date, founded_date)
      .input('key_products', sql.NVarChar, key_products)
      .input('core_advantages', sql.NVarChar, core_advantages)
      .input('disadvantages', sql.NVarChar, disadvantages)
      .input('market_strategy', sql.NVarChar, market_strategy)
      .input('contact_info', sql.NVarChar, contact_info)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO competitors (name, company, industry, strength, market_share, founded_date, key_products, core_advantages, disadvantages, market_strategy, contact_info, remarks, created_at, updated_at)
        VALUES (@name, @company, @industry, @strength, @market_share, @founded_date, @key_products, @core_advantages, @disadvantages, @market_strategy, @contact_info, @remarks, GETDATE(), GETDATE())
        SELECT SCOPE_IDENTITY() as id
      `);
    
    const newId = result.recordset[0].id;
    
    // 获取创建的竞争对手信息
    const competitorResult = await pool.request()
      .input('id', sql.Int, newId)
      .query('SELECT * FROM competitors WHERE id = @id');
    
    res.status(201).json(exports.formatResponse(true, competitorResult.recordset[0], '创建竞争对手成功'));
  } catch (error) {
    console.error('创建竞争对手失败:', error);
    res.status(500).json(exports.formatResponse(false, null, '创建竞争对手失败'));
  }
};

// 更新竞争对手
exports.updateCompetitor = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { name, company, industry, strength, market_share, founded_date, key_products, core_advantages, disadvantages, market_strategy, contact_info, remarks } = req.body;
    
    // 检查竞争对手是否存在
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM competitors WHERE id = @id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json(exports.formatResponse(false, null, '竞争对手不存在'));
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('company', sql.NVarChar, company)
      .input('industry', sql.NVarChar, industry)
      .input('strength', sql.NVarChar, strength)
      .input('market_share', sql.Decimal, market_share)
      .input('founded_date', sql.Date, founded_date)
      .input('key_products', sql.NVarChar, key_products)
      .input('core_advantages', sql.NVarChar, core_advantages)
      .input('disadvantages', sql.NVarChar, disadvantages)
      .input('market_strategy', sql.NVarChar, market_strategy)
      .input('contact_info', sql.NVarChar, contact_info)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE competitors SET
          name = @name,
          company = @company,
          industry = @industry,
          strength = @strength,
          market_share = @market_share,
          founded_date = @founded_date,
          key_products = @key_products,
          core_advantages = @core_advantages,
          disadvantages = @disadvantages,
          market_strategy = @market_strategy,
          contact_info = @contact_info,
          remarks = @remarks,
          updated_at = GETDATE()
        WHERE id = @id
      `);
    
    // 获取更新后的竞争对手信息
    const competitorResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM competitors WHERE id = @id');
    
    res.json(exports.formatResponse(true, competitorResult.recordset[0], '更新竞争对手成功'));
  } catch (error) {
    console.error('更新竞争对手失败:', error);
    res.status(500).json(exports.formatResponse(false, null, '更新竞争对手失败'));
  }
};

// 删除竞争对手
exports.deleteCompetitor = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    
    // 检查竞争对手是否存在
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM competitors WHERE id = @id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json(exports.formatResponse(false, null, '竞争对手不存在'));
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM competitors WHERE id = @id');
    
    res.json(exports.formatResponse(true, null, '删除竞争对手成功'));
  } catch (error) {
    console.error('删除竞争对手失败:', error);
    res.status(500).json(exports.formatResponse(false, null, '删除竞争对手失败'));
  }
};