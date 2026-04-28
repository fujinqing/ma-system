const sql = require('mssql');
const db = require('../config/database');

class MdmCustomerService {
  async ensureTable() {
    const pool = await db.getPool();
    const request = pool.request();
    await request.query(`
      IF OBJECT_ID('dbo.mdm_customer', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mdm_customer (
          customer_id INT IDENTITY(1,1) PRIMARY KEY,
          customer_code NVARCHAR(100) UNIQUE NOT NULL,
          customer_name NVARCHAR(255) NOT NULL,
          customer_short_name NVARCHAR(255),
          customer_type NVARCHAR(50),
          industry NVARCHAR(100),
          contact_person NVARCHAR(100),
          contact_phone NVARCHAR(50),
          contact_email NVARCHAR(100),
          address NVARCHAR(500),
          credit_level NVARCHAR(50),
          source NVARCHAR(100),
          cooperation_status NVARCHAR(50) DEFAULT 'potential',
          belong_org INT,
          create_time DATETIME DEFAULT GETDATE(),
          update_time DATETIME DEFAULT GETDATE(),
          is_deleted BIT DEFAULT 0
        )
      END
    `);
  }

  async getAll(page = 1, limit = 20, search = '') {
    await this.ensureTable();
    const pool = await db.getPool();
    const request = pool.request();

    let whereClause = ' WHERE is_deleted = 0 ';
    if (search) {
      whereClause += ` AND (customer_name LIKE @search OR customer_code LIKE @search) `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const countResult = await pool.request()
      .query(`SELECT COUNT(*) as total FROM dbo.mdm_customer ${whereClause}`);
    const total = countResult.recordset[0].total;

    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT * FROM dbo.mdm_customer ${whereClause}
      ORDER BY customer_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(customerId) {
    await this.ensureTable();
    const pool = await db.getPool();
    const result = await pool.request()
      .input('customerId', sql.Int, customerId)
      .query('SELECT * FROM dbo.mdm_customer WHERE customer_id = @customerId AND is_deleted = 0');
    return result.recordset[0] || null;
  }

  async create(customerData) {
    await this.ensureTable();
    const pool = await db.getPool();
    const request = pool.request();

    request.input('customer_code', sql.NVarChar, customerData.customer_code);
    request.input('customer_name', sql.NVarChar, customerData.customer_name);
    request.input('customer_short_name', sql.NVarChar, customerData.customer_short_name || null);
    request.input('customer_type', sql.NVarChar, customerData.customer_type || 'enterprise');
    request.input('industry', sql.NVarChar, customerData.industry || null);
    request.input('contact_person', sql.NVarChar, customerData.contact_person || null);
    request.input('contact_phone', sql.NVarChar, customerData.contact_phone || null);
    request.input('contact_email', sql.NVarChar, customerData.contact_email || null);
    request.input('address', sql.NVarChar, customerData.address || null);
    request.input('credit_level', sql.NVarChar, customerData.credit_level || null);
    request.input('source', sql.NVarChar, customerData.source || null);
    request.input('cooperation_status', sql.NVarChar, customerData.cooperation_status || 'potential');
    request.input('belong_org', sql.Int, customerData.belong_org || null);

    const result = await request.query(`
      INSERT INTO dbo.mdm_customer (customer_code, customer_name, customer_short_name, customer_type, industry, contact_person, contact_phone, contact_email, address, credit_level, source, cooperation_status, belong_org)
      VALUES (@customer_code, @customer_name, @customer_short_name, @customer_type, @industry, @contact_person, @contact_phone, @contact_email, @address, @credit_level, @source, @cooperation_status, @belong_org);
      SELECT SCOPE_IDENTITY() as customer_id;
    `);

    const customerId = result.recordset[0].customer_id;
    return this.getById(customerId);
  }

  async update(customerId, customerData) {
    const pool = await db.getPool();
    const request = pool.request();

    request.input('customerId', sql.Int, customerId);
    request.input('customer_name', sql.NVarChar, customerData.customer_name);
    request.input('customer_short_name', sql.NVarChar, customerData.customer_short_name || null);
    request.input('customer_type', sql.NVarChar, customerData.customer_type);
    request.input('industry', sql.NVarChar, customerData.industry || null);
    request.input('contact_person', sql.NVarChar, customerData.contact_person || null);
    request.input('contact_phone', sql.NVarChar, customerData.contact_phone || null);
    request.input('contact_email', sql.NVarChar, customerData.contact_email || null);
    request.input('address', sql.NVarChar, customerData.address || null);
    request.input('credit_level', sql.NVarChar, customerData.credit_level || null);
    request.input('source', sql.NVarChar, customerData.source || null);
    request.input('cooperation_status', sql.NVarChar, customerData.cooperation_status || 'potential');
    request.input('belong_org', sql.Int, customerData.belong_org || null);

    await request.query(`
      UPDATE dbo.mdm_customer
      SET customer_name = @customer_name,
          customer_short_name = @customer_short_name,
          customer_type = @customer_type,
          industry = @industry,
          contact_person = @contact_person,
          contact_phone = @contact_phone,
          contact_email = @contact_email,
          address = @address,
          credit_level = @credit_level,
          source = @source,
          cooperation_status = @cooperation_status,
          belong_org = @belong_org,
          update_time = GETDATE()
      WHERE customer_id = @customerId
    `);

    return this.getById(customerId);
  }

  async delete(customerId) {
    const pool = await db.getPool();
    await pool.request()
      .input('customerId', sql.Int, customerId)
      .query('UPDATE dbo.mdm_customer SET is_deleted = 1, update_time = GETDATE() WHERE customer_id = @customerId');
    return { customer_id: customerId };
  }
}

module.exports = new MdmCustomerService();
