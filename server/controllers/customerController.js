const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');
const eventBus = require('../services/eventBus');
const { BUSINESS_TYPES, EVENT_ACTIONS, eventDefinitions } = require('../services/eventSchema');

const publishCustomerEvent = (action, entityData, operator) => {
  try {
    const eventName = eventDefinitions.customer[action];
    if (eventName) {
      eventBus.publish(eventName, {
        businessType: BUSINESS_TYPES.CUSTOMER,
        action,
        entityData,
        operator
      });
    }
  } catch (eventErr) {
    console.warn('发布客户事件失败，不影响主流程:', eventErr.message);
  }
};

const getAllCustomers = async (req, res) => {
  try {
    console.log('getAllCustomers 函数被调用');
    const { page = 1, limit = 20, status, level, salesId, keyword, customerType, customerPoolType, enterpriseCategory, cooperationLevel } = req.query;
    const offset = (page - 1) * limit;

    console.log('获取客户列表请求参数:', req.query);

    const pool = await getPool();

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (status) {
      paramIndex++;
      whereClause += ` AND c.status = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: status });
    }

    if (level) {
      paramIndex++;
      whereClause += ` AND c.level = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: level });
    }

    if (salesId) {
      paramIndex++;
      whereClause += ` AND c.sales_id = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.Int, value: parseInt(salesId) });
    }

    if (customerType) {
      paramIndex++;
      whereClause += ` AND c.customer_type = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: customerType });
    }

    if (customerPoolType) {
      paramIndex++;
      whereClause += ` AND c.customer_pool_type = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: customerPoolType });
    }

    if (enterpriseCategory) {
      paramIndex++;
      whereClause += ` AND c.enterprise_category = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: enterpriseCategory });
    }

    if (cooperationLevel) {
      paramIndex++;
      whereClause += ` AND c.cooperation_level = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: cooperationLevel });
    }

    if (keyword) {
      paramIndex++;
      whereClause += ` AND (c.name LIKE @p${paramIndex} OR c.short_name LIKE @p${paramIndex} OR c.code LIKE @p${paramIndex})`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: `%${keyword}%` });
    }

    // 查询客户总数
    let countRequest = pool.request();
    params.forEach(param => countRequest = countRequest.input(param.name, param.type, param.value));
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total 
      FROM customers c
      ${whereClause}
    `);
    const totalCustomers = countResult.recordset[0].total;

    // 查询客户列表
    let listRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(param => listRequest = listRequest.input(param.name, param.type, param.value));
    
    // 查询客户数据，同时获取销售经理的姓名和电话
    // 使用 ROW_NUMBER() 兼容 SQL Server 2008 R2
    const result = await listRequest.query(`
      SELECT * FROM (
        SELECT 
          c.*, 
          u.name as sales_name, 
          u.phone as sales_phone,
          ROW_NUMBER() OVER (ORDER BY c.updated_at DESC) as RowNum
        FROM customers c
        LEFT JOIN sys_users u ON c.sales_id = u.id
        ${whereClause}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
      ORDER BY RowNum
    `);

    // 调试信息：输出查询结果
    console.log('查询到的客户数量:', result.recordset.length);
    console.log('总客户数量:', totalCustomers);

    await AuditLog.log('VIEW_CUSTOMER_LIST', req.user?.id, { filters: req.query }, req);

    // 确保返回的格式符合前端期望
    const responseData = {
      customers: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    };
    
    // 返回标准格式的响应
    res.json(res.formatResponse(true, responseData));
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户列表失败'));
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT c.*, u.name as sales_name, u.phone as sales_phone, u.email as sales_email
        FROM customers c
        LEFT JOIN sys_users u ON c.sales_id = u.id
        WHERE c.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }

    await AuditLog.log('VIEW_CUSTOMER', req.user?.id, { customerId: id }, req);

    res.json(res.formatResponse(true, result.recordset[0]));
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户详情失败'));
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      name, short_name, customer_type, enterprise_category, source, industry,
      equipment_type, annual_purchase_amount, cooperation_level, region, main_equipment,
      level, status,
      contact_person, contact_phone, email, address, website, bank,
      bank_account, tax_id, annual_revenue, employee_count, main_products,
      sales_id, remarks, contact_position, factory_address, company_scale,
      cooperation_years, tags, customer_pool_type
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json(res.formatResponse(false, null, '客户名称不能为空'));
    }

    let pool;
    try {
      pool = await getPool();
    } catch (dbErr) {
      console.error('数据库连接失败:', dbErr);
      return res.status(500).json(res.formatResponse(false, null, '数据库连接失败'));
    }

    let newCode = 'CUST00001';
    try {
      const maxCodeResult = await pool.request().query(`
        SELECT TOP 1 code FROM customers WHERE code IS NOT NULL ORDER BY code DESC
      `);
      if (maxCodeResult.recordset.length > 0) {
        const maxCode = maxCodeResult.recordset[0].code;
        const num = parseInt(maxCode.replace('CUST', '')) + 1;
        newCode = 'CUST' + num.toString().padStart(5, '0');
      }
    } catch (codeErr) {
      console.warn('生成客户编码失败，使用默认编码:', codeErr.message);
    }

    let newCustomerId;
    try {
      const result = await pool.request()
        .input('name', sql.NVarChar, name ? name.trim() : null)
        .input('short_name', sql.NVarChar, short_name || null)
        .input('customer_type', sql.NVarChar, customer_type || 'potential')
        .input('enterprise_category', sql.NVarChar, enterprise_category || null)
        .input('source', sql.NVarChar, source || null)
        .input('industry', sql.NVarChar, industry || null)
        .input('equipment_type', sql.NVarChar, equipment_type || null)
        .input('annual_purchase_amount', sql.Decimal(18, 2), annual_purchase_amount ? parseFloat(annual_purchase_amount) : null)
        .input('cooperation_level', sql.NVarChar, cooperation_level || null)
        .input('region', sql.NVarChar, region || null)
        .input('main_equipment', sql.NVarChar, main_equipment || null)
        .input('level', sql.NVarChar, level || 'normal')
        .input('status', sql.NVarChar, status || 'active')
        .input('customer_pool_type', sql.NVarChar, customer_pool_type || 'public')
        .input('contact_person', sql.NVarChar, contact_person || null)
        .input('contact_phone', sql.NVarChar, contact_phone || null)
        .input('contact_email', sql.NVarChar, email || null)
        .input('contact_position', sql.NVarChar, contact_position || null)
        .input('address', sql.NVarChar, (factory_address || address) || null)
        .input('website', sql.NVarChar, website || null)
        .input('bank', sql.NVarChar, bank || null)
        .input('bank_account', sql.NVarChar, bank_account || null)
        .input('tax_id', sql.NVarChar, tax_id || null)
        .input('annual_revenue', sql.Decimal(18, 2), annual_revenue ? parseFloat(annual_revenue) : null)
        .input('employee_count', sql.Int, employee_count ? parseInt(employee_count) : null)
        .input('main_products', sql.NVarChar, main_products || null)
        .input('company_scale', sql.NVarChar, company_scale || null)
        .input('cooperation_years', sql.Int, cooperation_years ? parseInt(cooperation_years) : null)
        .input('sales_id', sql.Int, sales_id ? parseInt(sales_id) : null)
        .input('code', sql.NVarChar, newCode)
        .input('remarks', sql.NVarChar, remarks || null)
        .input('tags', sql.NVarChar, Array.isArray(tags) ? tags.join(',') : (tags || ''))
        .query(`
          INSERT INTO customers (
            code, name, short_name, customer_type, enterprise_category, source, industry,
            equipment_type, annual_purchase_amount, cooperation_level, region, main_equipment,
            level, status, customer_pool_type,
            contact_person, contact_phone, contact_email, contact_position, address,
            website, bank, bank_account, tax_id, annual_revenue, employee_count,
            main_products, company_scale, cooperation_years, sales_id, remarks, tags
          ) VALUES (
            @code, @name, @short_name, @customer_type, @enterprise_category, @source, @industry,
            @equipment_type, @annual_purchase_amount, @cooperation_level, @region, @main_equipment,
            @level, @status, @customer_pool_type,
            @contact_person, @contact_phone, @contact_email, @contact_position, @address,
            @website, @bank, @bank_account, @tax_id, @annual_revenue, @employee_count,
            @main_products, @company_scale, @cooperation_years, @sales_id, @remarks, @tags
          )
          SELECT SCOPE_IDENTITY() as id;
        `);
      newCustomerId = result.recordset[0].id;
    } catch (insertErr) {
      console.error('插入客户数据失败:', insertErr);
      return res.status(500).json(res.formatResponse(false, null, '创建客户失败: ' + insertErr.message));
    }

    try {
      await AuditLog.log('CREATE_CUSTOMER', req.user?.id, { customerId: newCustomerId, name, code: newCode }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    publishCustomerEvent('create', {
      id: newCustomerId,
      code: newCode,
      name: name,
      short_name: short_name,
      enterprise_category,
      level: level || 'normal',
      customer_type: customer_type || 'potential',
      customer_pool_type: customer_pool_type || 'public',
      industry,
      equipment_type,
      annual_purchase_amount,
      cooperation_level,
      region,
      main_equipment,
      main_products,
      company_scale,
      cooperation_years,
      sales_id,
      status: 'active'
    }, req.user?.name || req.user?.username);

    res.json(res.formatResponse(true, { id: newCustomerId, code: newCode }, '客户创建成功'));
  } catch (error) {
    console.error('创建客户系统异常:', error);
    res.status(500).json(res.formatResponse(false, null, '创建客户失败'));
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, short_name, customer_type, enterprise_category, source, industry,
      equipment_type, annual_purchase_amount, cooperation_level, region, main_equipment,
      level, status, customer_pool_type,
      contact_person, contact_phone, email, contact_position, address,
      website, bank, bank_account, tax_id, annual_revenue, employee_count,
      main_products, sales_id, assigned_date, lost_reason, remarks,
      last_contact_date, factory_address, company_scale, cooperation_years, tags
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json(res.formatResponse(false, null, '无效的客户ID'));
    }

    if (!name || name.trim() === '') {
      return res.status(400).json(res.formatResponse(false, null, '客户名称不能为空'));
    }

    let pool;
    try {
      pool = await getPool();
    } catch (dbErr) {
      console.error('数据库连接失败:', dbErr);
      return res.status(500).json(res.formatResponse(false, null, '数据库连接失败'));
    }

    let customerExists = false;
    try {
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM customers WHERE id = @id');
      customerExists = checkResult.recordset.length > 0;
    } catch (checkErr) {
      console.error('检查客户存在性失败:', checkErr);
      return res.status(500).json(res.formatResponse(false, null, '检查客户失败'));
    }

    if (!customerExists) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }

    let updatedData = null;
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .input('name', sql.NVarChar, name ? name.trim() : null)
        .input('short_name', sql.NVarChar, short_name || null)
        .input('customer_type', sql.NVarChar, customer_type || null)
        .input('enterprise_category', sql.NVarChar, enterprise_category || null)
        .input('source', sql.NVarChar, source || null)
        .input('industry', sql.NVarChar, industry || null)
        .input('equipment_type', sql.NVarChar, equipment_type || null)
        .input('annual_purchase_amount', sql.Decimal(18, 2), annual_purchase_amount ? parseFloat(annual_purchase_amount) : null)
        .input('cooperation_level', sql.NVarChar, cooperation_level || null)
        .input('region', sql.NVarChar, region || null)
        .input('main_equipment', sql.NVarChar, main_equipment || null)
        .input('level', sql.NVarChar, level || null)
        .input('status', sql.NVarChar, status || null)
        .input('customer_pool_type', sql.NVarChar, customer_pool_type || 'public')
        .input('contact_person', sql.NVarChar, contact_person || null)
        .input('contact_phone', sql.NVarChar, contact_phone || null)
        .input('contact_email', sql.NVarChar, email || null)
        .input('contact_position', sql.NVarChar, contact_position || null)
        .input('address', sql.NVarChar, (factory_address || address) || null)
        .input('website', sql.NVarChar, website || null)
        .input('bank', sql.NVarChar, bank || null)
        .input('bank_account', sql.NVarChar, bank_account || null)
        .input('tax_id', sql.NVarChar, tax_id || null)
        .input('annual_revenue', sql.Decimal(18, 2), annual_revenue ? parseFloat(annual_revenue) : null)
        .input('employee_count', sql.Int, employee_count ? parseInt(employee_count) : null)
        .input('main_products', sql.NVarChar, main_products || null)
        .input('company_scale', sql.NVarChar, company_scale || null)
        .input('cooperation_years', sql.Int, cooperation_years ? parseInt(cooperation_years) : null)
        .input('sales_id', sql.Int, sales_id ? parseInt(sales_id) : null)
        .input('assigned_date', sql.Date, assigned_date || null)
        .input('lost_reason', sql.NVarChar, lost_reason || null)
        .input('remarks', sql.NVarChar, remarks || null)
        .input('last_contact_date', sql.Date, last_contact_date || null)
        .input('tags', sql.NVarChar, Array.isArray(tags) ? tags.join(',') : (tags || ''))
        .query(`
          UPDATE customers SET
            name = @name,
            short_name = @short_name,
            customer_type = @customer_type,
            enterprise_category = @enterprise_category,
            source = @source,
            industry = @industry,
            equipment_type = @equipment_type,
            annual_purchase_amount = @annual_purchase_amount,
            cooperation_level = @cooperation_level,
            region = @region,
            main_equipment = @main_equipment,
            level = @level,
            status = @status,
            customer_pool_type = @customer_pool_type,
            contact_person = @contact_person,
            contact_phone = @contact_phone,
            contact_email = @contact_email,
            contact_position = @contact_position,
            address = @address,
            website = @website,
            bank = @bank,
            bank_account = @bank_account,
            tax_id = @tax_id,
            annual_revenue = @annual_revenue,
            employee_count = @employee_count,
            main_products = @main_products,
            company_scale = @company_scale,
            cooperation_years = @cooperation_years,
            sales_id = @sales_id,
            assigned_date = @assigned_date,
            lost_reason = @lost_reason,
            remarks = @remarks,
            last_contact_date = @last_contact_date,
            tags = @tags,
            updated_at = GETDATE()
          WHERE id = @id
        `);

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT c.*, u.name as sales_name, u.phone as sales_phone, u.email as sales_email
          FROM customers c
          LEFT JOIN sys_users u ON c.sales_id = u.id
          WHERE c.id = @id
        `);
      updatedData = result.recordset[0];
    } catch (updateErr) {
      console.error('更新客户数据失败:', updateErr);
      return res.status(500).json(res.formatResponse(false, null, '更新客户失败: ' + updateErr.message));
    }

    try {
      await AuditLog.log('UPDATE_CUSTOMER', req.user?.id, { customerId: id }, req);
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    if (updatedData) {
      publishCustomerEvent('update', updatedData, req.user?.name || req.user?.username);
    }

    res.json(res.formatResponse(true, updatedData, '客户更新成功'));
  } catch (error) {
    console.error('更新客户系统异常:', error);
    res.status(500).json(res.formatResponse(false, null, '更新客户失败'));
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json(res.formatResponse(false, null, '无效的客户ID'));
    }

    const pool = await getPool();

    let transaction;
    try {
      transaction = pool.transaction();
      await transaction.begin();
    } catch (txErr) {
      console.error('创建事务失败:', txErr);
      return res.status(500).json(res.formatResponse(false, null, '数据库事务初始化失败'));
    }

    try {
      const checkResult = await transaction.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM customers WHERE id = @id');

      if (checkResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
      }

      await transaction.request()
        .input('customerId', sql.Int, id)
        .query('DELETE FROM customer_contacts WHERE customer_id = @customerId');

      await transaction.request()
        .input('customerId', sql.Int, id)
        .query('DELETE FROM customer_activities WHERE customer_id = @customerId');

      await transaction.request()
        .input('customerId', sql.Int, id)
        .query('DELETE FROM customer_documents WHERE customer_id = @customerId');

      await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM customers WHERE id = @id');

      await transaction.commit();

      await AuditLog.log('DELETE_CUSTOMER', req.user?.id, { customerId: id }, req);

      publishCustomerEvent('delete', { id: parseInt(id) }, req.user?.name || req.user?.username);

      res.json(res.formatResponse(true, { id: parseInt(id) }, '客户删除成功'));
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('回滚失败:', rollbackErr);
      }
      console.error('删除客户业务错误:', error);

      if (error.number === 547) {
        return res.status(400).json(res.formatResponse(false, null, '该客户存在关联数据，无法删除'));
      }

      res.status(500).json(res.formatResponse(false, null, '删除客户失败: ' + error.message));
    }
  } catch (error) {
    console.error('删除客户系统错误:', error);
    res.status(500).json(res.formatResponse(false, null, '删除客户失败'));
  }
};

// 删除全部客户数据（危险操作，仅管理员可用）
const deleteAllCustomers = async (req, res) => {
  try {
    const pool = await getPool();
    
    // 开始事务
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // 1. 删除客户联系表数据
      await transaction.request().query('DELETE FROM customer_contacts');
      
      // 2. 删除客户活动表数据
      await transaction.request().query('DELETE FROM customer_activities');
      
      // 3. 删除客户文件表数据
      await transaction.request().query('DELETE FROM customer_documents');
      
      // 4. 删除客户表数据
      await transaction.request().query('DELETE FROM customers');
      
      // 提交事务
      await transaction.commit();
      
      await AuditLog.log('DELETE_ALL_CUSTOMERS', req.user?.id, { }, req);

      res.json(res.formatResponse(true, null, '全部客户数据删除成功'));
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('删除全部客户数据失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除全部客户数据失败'));
    }
  } catch (error) {
    console.error('删除全部客户数据失败:', error);
    res.status(500).json(res.formatResponse(false, null, '删除全部客户数据失败'));
  }
};

const getCustomerContacts = async (req, res) => {
  try {
    const { customerId } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('customerId', sql.Int, customerId)
      .query('SELECT * FROM customer_contacts WHERE customer_id = @customerId ORDER BY is_primary DESC, name');

    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取客户联系人失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户联系人失败'));
  }
};

const addCustomerContact = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, position, phone, mobile, email, is_primary, birthday, hobbies, remarks } = req.body;
    const pool = await getPool();

    if (is_primary) {
      await pool.request()
        .input('customerId', sql.Int, customerId)
        .query('UPDATE customer_contacts SET is_primary = 0 WHERE customer_id = @customerId');
    }

    const result = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .input('name', sql.NVarChar, name)
      .input('position', sql.NVarChar, position)
      .input('phone', sql.NVarChar, phone)
      .input('mobile', sql.NVarChar, mobile)
      .input('email', sql.NVarChar, email)
      .input('is_primary', sql.Bit, is_primary ? 1 : 0)
      .input('birthday', sql.DateTime, birthday)
      .input('hobbies', sql.NVarChar, hobbies)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO customer_contacts (customer_id, name, position, phone, mobile, email, is_primary, birthday, hobbies, remarks)
        VALUES (@customer_id, @name, @position, @phone, @mobile, @email, @is_primary, @birthday, @hobbies, @remarks);
        SELECT SCOPE_IDENTITY() as id;
      `);

    await AuditLog.log('ADD_CUSTOMER_CONTACT', req.user?.id, { customerId, contactId: result.recordset[0].id }, req);

    res.json(res.formatResponse(true, { id: result.recordset[0].id }, '联系人添加成功'));
  } catch (error) {
    console.error('添加联系人失败:', error);
    res.status(500).json(res.formatResponse(false, null, '添加联系人失败'));
  }
};

const updateCustomerContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, position, phone, mobile, email, is_primary, birthday, hobbies, remarks } = req.body;
    const pool = await getPool();

    const contactResult = await pool.request()
      .input('contactId', sql.Int, contactId)
      .query('SELECT customer_id FROM customer_contacts WHERE id = @contactId');

    if (contactResult.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '联系人不存在'));
    }

    if (is_primary) {
      await pool.request()
        .input('customerId', sql.Int, contactResult.recordset[0].customer_id)
        .query('UPDATE customer_contacts SET is_primary = 0 WHERE customer_id = @customerId');
    }

    await pool.request()
      .input('id', sql.Int, contactId)
      .input('name', sql.NVarChar, name)
      .input('position', sql.NVarChar, position)
      .input('phone', sql.NVarChar, phone)
      .input('mobile', sql.NVarChar, mobile)
      .input('email', sql.NVarChar, email)
      .input('is_primary', sql.Bit, is_primary ? 1 : 0)
      .input('birthday', sql.DateTime, birthday)
      .input('hobbies', sql.NVarChar, hobbies)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE customer_contacts SET
          name = @name, position = @position, phone = @phone, mobile = @mobile,
          email = @email, is_primary = @is_primary, birthday = @birthday,
          hobbies = @hobbies, remarks = @remarks, updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json(res.formatResponse(true, null, '联系人更新成功'));
  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json(res.formatResponse(false, null, '更新联系人失败'));
  }
};

const deleteCustomerContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, contactId)
      .query('DELETE FROM customer_contacts WHERE id = @id');

    res.json(res.formatResponse(true, null, '联系人删除成功'));
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json(res.formatResponse(false, null, '删除联系人失败'));
  }
};

const getCustomerActivities = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 20, activityType } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();

    let whereClause = `WHERE customer_id = @customerId`;
    const params = [
      { name: 'customerId', type: sql.Int, value: parseInt(customerId) }
    ];
    let paramIndex = 1;

    if (activityType) {
      paramIndex++;
      whereClause += ` AND activity_type = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: activityType });
    }

    // 查询客户活动总数
    let countRequest = pool.request();
    params.forEach(param => countRequest = countRequest.input(param.name, param.type, param.value));
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total 
      FROM customer_activities
      ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // 查询客户活动列表 - 使用 ROW_NUMBER() 兼容 SQL Server 2008 R2
    let listRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(param => listRequest = listRequest.input(param.name, param.type, param.value));
    
    const result = await listRequest.query(`
      SELECT * FROM (
        SELECT 
          a.*, 
          u.name as created_by_name,
          ROW_NUMBER() OVER (ORDER BY a.created_at DESC) as RowNum
        FROM customer_activities a
        LEFT JOIN sys_users u ON a.created_by = u.id
        ${whereClause}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
      ORDER BY RowNum
    `);

    res.json(res.formatResponse(true, {
      activities: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    console.error('获取客户跟进记录失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户跟进记录失败'));
  }
};

const addCustomerActivity = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { activity_type, subject, content, next_plan_date, next_plan_content, attachments } = req.body;

    const pool = await getPool();

    // 开始事务
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // 1. 检查客户是否存在
      const customerResult = await transaction.request()
        .input('id', sql.Int, parseInt(customerId))
        .query('SELECT id FROM customers WHERE id = @id');
      
      if (customerResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
      }
      
      // 2. 更新客户的最后联系日期
      await transaction.request()
        .input('id', sql.Int, parseInt(customerId))
        .query(`
          UPDATE customers 
          SET last_contact_date = GETDATE(), updated_at = GETDATE() 
          WHERE id = @id
        `);
      
      // 3. 插入新的活动记录
      const result = await transaction.request()
        .input('customer_id', sql.Int, parseInt(customerId))
        .input('activity_type', sql.NVarChar, activity_type)
        .input('subject', sql.NVarChar, subject)
        .input('content', sql.NVarChar, content)
        .input('next_plan_date', sql.DateTime, next_plan_date)
        .input('next_plan_content', sql.NVarChar, next_plan_content)
        .input('attachments', sql.NVarChar, JSON.stringify(attachments || []))
        .input('created_by', sql.Int, req.user?.id || 1)
        .query(`
          INSERT INTO customer_activities 
          (customer_id, activity_type, subject, content, next_plan_date, next_plan_content, attachments, created_by, created_at) 
          OUTPUT INSERTED.id
          VALUES (@customer_id, @activity_type, @subject, @content, @next_plan_date, @next_plan_content, @attachments, @created_by, GETDATE())
        `);
      
      const newActivityId = result.recordset[0].id;
      
      // 提交事务
      await transaction.commit();
      
      await AuditLog.log('ADD_CUSTOMER_ACTIVITY', req.user?.id, { customerId, activityId: newActivityId }, req);

      res.json(res.formatResponse(true, { id: newActivityId }, '跟进记录添加成功'));
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('添加跟进记录失败:', error);
      res.status(500).json(res.formatResponse(false, null, '添加跟进记录失败'));
    }
  } catch (error) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json(res.formatResponse(false, null, '添加跟进记录失败'));
  }
};

const getCustomerStatistics = async (req, res) => {
  try {
    const { customerId } = req.params;
    const pool = await getPool();

    const [customer, contactCount, activityCount, documentCount, recentActivities] = await Promise.all([
      pool.request().input('id', sql.Int, customerId).query('SELECT * FROM customers WHERE id = @id'),
      pool.request().input('customerId', sql.Int, customerId).query('SELECT COUNT(*) as count FROM customer_contacts WHERE customer_id = @customerId'),
      pool.request().input('customerId', sql.Int, customerId).query('SELECT COUNT(*) as count FROM customer_activities WHERE customer_id = @customerId'),
      pool.request().input('customerId', sql.Int, customerId).query('SELECT COUNT(*) as count FROM customer_documents WHERE customer_id = @customerId'),
      pool.request().input('customerId', sql.Int, customerId).query('SELECT TOP 5 * FROM customer_activities WHERE customer_id = @customerId ORDER BY created_at DESC')
    ]);

    if (customer.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }

    res.json(res.formatResponse(true, {
      customer: customer.recordset[0],
      statistics: {
        contactCount: contactCount.recordset[0].count,
        activityCount: activityCount.recordset[0].count,
        documentCount: documentCount.recordset[0].count
      },
      recentActivities: recentActivities.recordset
    }));
  } catch (error) {
    console.error('获取客户统计失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户统计失败'));
  }
};

// 领取公海客户
const claimCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    console.log('领取客户 - 当前用户ID:', userId);
    console.log('领取客户 - 客户ID:', id);
    
    if (!userId) {
      return res.status(401).json(res.formatResponse(false, null, '请先登录'));
    }

    const pool = await getPool();
    
    // 检查客户是否存在且为公海客户
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, name, customer_pool_type, sales_id 
        FROM customers 
        WHERE id = @id
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }
    
    const customer = checkResult.recordset[0];
    
    // 检查是否已经是私海客户
    if (customer.customer_pool_type === 'private' && customer.sales_id) {
      return res.status(400).json(res.formatResponse(false, null, '该客户已被其他销售员跟进'));
    }

    // 更新客户为私海客户
    await pool.request()
      .input('id', sql.Int, id)
      .input('sales_id', sql.Int, userId)
      .input('claimed_by', sql.Int, userId)
      .query(`
        UPDATE customers SET
          customer_pool_type = 'private',
          sales_id = @sales_id,
          claimed_by = @claimed_by,
          claimed_at = GETDATE(),
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // 记录客户池操作日志
    await pool.request()
      .input('customer_id', sql.Int, id)
      .input('action_type', sql.NVarChar, 'claim')
      .input('to_sales_id', sql.Int, userId)
      .input('from_pool_type', sql.NVarChar, 'public')
      .input('to_pool_type', sql.NVarChar, 'private')
      .input('operator_id', sql.Int, userId)
      .input('remarks', sql.NVarChar, '员工主动领取公海客户')
      .query(`
        INSERT INTO customer_pool_logs 
        (customer_id, action_type, to_sales_id, from_pool_type, to_pool_type, operator_id, remarks)
        VALUES (@customer_id, @action_type, @to_sales_id, @from_pool_type, @to_pool_type, @operator_id, @remarks)
      `);

    await AuditLog.log('CLAIM_CUSTOMER', userId, { customerId: id, customerName: customer.name }, req);

    res.json(res.formatResponse(true, null, '客户领取成功'));
  } catch (error) {
    console.error('领取客户失败:', error);
    res.status(500).json(res.formatResponse(false, null, '领取客户失败'));
  }
};

// 分配客户给销售员
const assignCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { sales_id, remarks } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(res.formatResponse(false, null, '请先登录'));
    }

    if (!sales_id) {
      return res.status(400).json(res.formatResponse(false, null, '请选择要分配的销售员'));
    }

    const pool = await getPool();
    
    // 检查客户是否存在
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, name, customer_pool_type, sales_id 
        FROM customers 
        WHERE id = @id
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }
    
    const customer = checkResult.recordset[0];
    const fromSalesId = customer.sales_id;
    const fromPoolType = customer.customer_pool_type;

    // 更新客户为私海客户并分配给指定销售员
    await pool.request()
      .input('id', sql.Int, id)
      .input('sales_id', sql.Int, sales_id)
      .input('assigned_by', sql.Int, userId)
      .query(`
        UPDATE customers SET
          customer_pool_type = 'private',
          sales_id = @sales_id,
          assigned_by = @assigned_by,
          assigned_at = GETDATE(),
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // 记录客户池操作日志
    await pool.request()
      .input('customer_id', sql.Int, id)
      .input('action_type', sql.NVarChar, 'assign')
      .input('from_sales_id', sql.Int, fromSalesId)
      .input('to_sales_id', sql.Int, sales_id)
      .input('from_pool_type', sql.NVarChar, fromPoolType)
      .input('to_pool_type', sql.NVarChar, 'private')
      .input('operator_id', sql.Int, userId)
      .input('remarks', sql.NVarChar, remarks || '管理员分配客户给销售员')
      .query(`
        INSERT INTO customer_pool_logs 
        (customer_id, action_type, from_sales_id, to_sales_id, from_pool_type, to_pool_type, operator_id, remarks)
        VALUES (@customer_id, @action_type, @from_sales_id, @to_sales_id, @from_pool_type, @to_pool_type, @operator_id, @remarks)
      `);

    await AuditLog.log('ASSIGN_CUSTOMER', userId, { customerId: id, customerName: customer.name, salesId: sales_id }, req);

    res.json(res.formatResponse(true, null, '客户分配成功'));
  } catch (error) {
    console.error('分配客户失败:', error);
    res.status(500).json(res.formatResponse(false, null, '分配客户失败'));
  }
};

// 释放客户到公海
const releaseCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(res.formatResponse(false, null, '请先登录'));
    }

    const pool = await getPool();
    
    // 检查客户是否存在
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, name, customer_pool_type, sales_id 
        FROM customers 
        WHERE id = @id
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }
    
    const customer = checkResult.recordset[0];
    
    // 检查是否已经是公海客户
    if (customer.customer_pool_type === 'public') {
      return res.status(400).json(res.formatResponse(false, null, '该客户已经是公海客户'));
    }

    // 更新客户为公海客户
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE customers SET
          customer_pool_type = 'public',
          sales_id = NULL,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // 记录客户池操作日志
    await pool.request()
      .input('customer_id', sql.Int, id)
      .input('action_type', sql.NVarChar, 'release')
      .input('from_sales_id', sql.Int, customer.sales_id)
      .input('from_pool_type', sql.NVarChar, 'private')
      .input('to_pool_type', sql.NVarChar, 'public')
      .input('operator_id', sql.Int, userId)
      .input('remarks', sql.NVarChar, remarks || '销售员释放客户到公海')
      .query(`
        INSERT INTO customer_pool_logs 
        (customer_id, action_type, from_sales_id, from_pool_type, to_pool_type, operator_id, remarks)
        VALUES (@customer_id, @action_type, @from_sales_id, @from_pool_type, @to_pool_type, @operator_id, @remarks)
      `);

    await AuditLog.log('RELEASE_CUSTOMER', userId, { customerId: id, customerName: customer.name }, req);

    res.json(res.formatResponse(true, null, '客户已释放到公海'));
  } catch (error) {
    console.error('释放客户失败:', error);
    res.status(500).json(res.formatResponse(false, null, '释放客户失败'));
  }
};

// 获取客户池操作日志
const getCustomerPoolLogs = async (req, res) => {
  try {
    const { customerId } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT 
          l.*,
          operator.name as operator_name,
          from_sales.name as from_sales_name,
          to_sales.name as to_sales_name
        FROM customer_pool_logs l
        LEFT JOIN sys_users operator ON l.operator_id = operator.id
        LEFT JOIN sys_users from_sales ON l.from_sales_id = from_sales.id
        LEFT JOIN sys_users to_sales ON l.to_sales_id = to_sales.id
        WHERE l.customer_id = @customer_id
        ORDER BY l.created_at DESC
      `);

    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取客户池日志失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户池日志失败'));
  }
};

// 获取客户池统计
const getCustomerPoolStatistics = async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as totalCustomers,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'public' THEN 1 ELSE 0 END), 0) as publicPoolCustomers,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'private' THEN 1 ELSE 0 END), 0) as privatePoolCustomers,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'public' AND status = 'active' THEN 1 ELSE 0 END), 0) as activePublicCustomers,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'private' AND status = 'active' THEN 1 ELSE 0 END), 0) as activePrivateCustomers
        FROM customers
      `);

    res.json(res.formatResponse(true, result.recordset[0]));
  } catch (error) {
    console.error('获取客户池统计失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取客户池统计失败'));
  }
};

const getSalesStatistics = async (req, res) => {
  try {
    const pool = await getPool();

    // 检查customers表是否存在
    const tableCheck = await pool.request().query(
      `SELECT OBJECT_ID('customers', 'U') as tableId`
    );
    console.log('customers表是否存在:', tableCheck.recordset[0].tableId !== null);

    // 检查 customer_pool_type 字段是否存在
    const columnCheck = await pool.request().query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_pool_type'`
    );
    const hasPoolType = columnCheck.recordset.length > 0;

    // 构建动态SQL查询
    let sql = `
        SELECT
          COUNT(*) as totalCustomers,
          ISNULL(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as activeCustomers,
          ISNULL(SUM(CASE WHEN customer_type = 'potential' THEN 1 ELSE 0 END), 0) as potentialCustomers,
          ISNULL(SUM(CASE WHEN customer_type = 'formal' THEN 1 ELSE 0 END), 0) as formalCustomers,
          ISNULL(SUM(CASE WHEN lost_reason IS NOT NULL THEN 1 ELSE 0 END), 0) as lostCustomers,
          ISNULL(SUM(CASE WHEN DATEDIFF(DAY, ISNULL(last_contact_date, created_at), GETDATE()) <= 7 THEN 1 ELSE 0 END), 0) as contactedThisWeek
    `;

    if (hasPoolType) {
      sql += `,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'public' THEN 1 ELSE 0 END), 0) as publicPoolCustomers,
          ISNULL(SUM(CASE WHEN customer_pool_type = 'private' THEN 1 ELSE 0 END), 0) as privatePoolCustomers
      `;
    } else {
      sql += `, 0 as publicPoolCustomers, 0 as privatePoolCustomers`;
    }

    sql += ` FROM customers`;

    const result = await pool.request().query(sql);
    console.log('销售统计查询结果:', result.recordset[0]);

    const statsData = result.recordset[0];
    res.json(res.formatResponse(true, {
      totalCustomers: statsData.totalCustomers || 0,
      activeCustomers: statsData.activeCustomers || 0,
      potentialCustomers: statsData.potentialCustomers || 0,
      formalCustomers: statsData.formalCustomers || 0,
      contactedThisWeek: statsData.contactedThisWeek || 0,
      publicPoolCustomers: statsData.publicPoolCustomers || 0,
      privatePoolCustomers: statsData.privatePoolCustomers || 0
    }));
  } catch (error) {
    console.error('获取销售统计失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取销售统计失败: ' + error.message));
  }
};

const submitCustomerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data, reason } = req.body;
    const operator = req.user?.name || req.user?.username;

    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM customers WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json(res.formatResponse(false, null, '客户不存在'));
    }

    const customer = checkResult.recordset[0];
    let flowType = 'crm_customer_create';
    if (action === 'update') flowType = 'crm_customer_update';
    else if (action === 'transfer') flowType = 'crm_customer_transfer';
    else if (action === 'archive') flowType = 'crm_customer_archive';
    else if (action === 'to_public') flowType = 'crm_customer_to_public';

    try {
      const workflow = require('../services/workflow');
      const flowResult = await workflow.flowInstance.startFlowInstance(
        flowType,
        {
          customerId: id,
          customerName: customer.name,
          customerCode: customer.code,
          action: action,
          data: data || {},
          reason: reason || ''
        },
        operator
      );

      if (flowResult && flowResult.instanceId) {
        await pool.request()
          .input('id', sql.Int, id)
          .input('flow_instance_id', sql.Int, flowResult.instanceId)
          .input('flow_status', sql.NVarChar, 'pending')
          .query(`
            UPDATE customers SET
              flow_instance_id = @flow_instance_id,
              flow_status = @flow_status,
              updated_at = GETDATE()
            WHERE id = @id
          `);

        await AuditLog.log('SUBMIT_CUSTOMER_APPROVAL', req.user?.id, { customerId: id, action, flowType }, req);

        publishCustomerEvent('update', {
          id: parseInt(id),
          flow_instance_id: flowResult.instanceId,
          flow_status: 'pending',
          action
        }, operator);

        return res.json(res.formatResponse(true, {
          instanceId: flowResult.instanceId,
          message: '已提交审批流程'
        }, '已提交审批流程'));
      }
    } catch (flowErr) {
      console.warn('启动审批流程失败，使用简化模式:', flowErr.message);
      return res.json(res.formatResponse(true, {
        simplified: true,
        message: '审批流程已简化处理'
      }, '已提交审批'));
    }
  } catch (error) {
    console.error('提交客户审批失败:', error);
    res.status(500).json(res.formatResponse(false, null, '提交审批失败'));
  }
};

const getCustomerApprovalList = async (req, res) => {
  try {
    const { status } = req.query;
    const pool = await getPool();

    let whereClause = 'WHERE c.flow_instance_id IS NOT NULL';
    if (status === 'pending') {
      whereClause += " AND c.flow_status = 'pending'";
    } else if (status === 'approved') {
      whereClause += " AND c.flow_status = 'approved'";
    } else if (status === 'rejected') {
      whereClause += " AND c.flow_status = 'rejected'";
    }

    const result = await pool.request()
      .query(`
        SELECT c.*, u.name as sales_name
        FROM customers c
        LEFT JOIN sys_users u ON c.sales_id = u.id
        ${whereClause}
        ORDER BY c.updated_at DESC
      `);

    res.json(res.formatResponse(true, result.recordset));
  } catch (error) {
    console.error('获取客户审批列表失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取审批列表失败'));
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  deleteAllCustomers,
  getSalesStatistics,
  getCustomerContacts,
  addCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  getCustomerActivities,
  addCustomerActivity,
  getCustomerStatistics,
  claimCustomer,
  assignCustomer,
  releaseCustomer,
  getCustomerPoolLogs,
  getCustomerPoolStatistics,
  submitCustomerApproval,
  getCustomerApprovalList
};
