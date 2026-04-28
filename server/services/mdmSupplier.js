const sql = require('mssql');
const db = require('../config/database');

class MdmSupplierService {
  async ensureTable() {
    const pool = await db.getPool();
    const request = pool.request();
    await request.query(`
      IF OBJECT_ID('dbo.mdm_supplier', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mdm_supplier (
          supplier_id INT IDENTITY(1,1) PRIMARY KEY,
          supplier_code NVARCHAR(100) UNIQUE NOT NULL,
          supplier_name NVARCHAR(255) NOT NULL,
          supplier_short_name NVARCHAR(255),
          supplier_type NVARCHAR(50),
          qualification_level NVARCHAR(50),
          contact_person NVARCHAR(100),
          contact_phone NVARCHAR(50),
          contact_email NVARCHAR(100),
          address NVARCHAR(500),
          cooperation_status NVARCHAR(50) DEFAULT 'pending',
          audit_status NVARCHAR(50) DEFAULT 'pending',
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
      whereClause += ` AND (supplier_name LIKE @search OR supplier_code LIKE @search) `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const countResult = await pool.request()
      .query(`SELECT COUNT(*) as total FROM dbo.mdm_supplier ${whereClause}`);
    const total = countResult.recordset[0].total;

    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT * FROM dbo.mdm_supplier ${whereClause}
      ORDER BY supplier_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(supplierId) {
    await this.ensureTable();
    const pool = await db.getPool();
    const result = await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query('SELECT * FROM dbo.mdm_supplier WHERE supplier_id = @supplierId AND is_deleted = 0');
    return result.recordset[0] || null;
  }

  async create(supplierData) {
    await this.ensureTable();
    const pool = await db.getPool();
    const request = pool.request();

    request.input('supplier_code', sql.NVarChar, supplierData.supplier_code);
    request.input('supplier_name', sql.NVarChar, supplierData.supplier_name);
    request.input('supplier_short_name', sql.NVarChar, supplierData.supplier_short_name || null);
    request.input('supplier_type', sql.NVarChar, supplierData.supplier_type || 'material');
    request.input('qualification_level', sql.NVarChar, supplierData.qualification_level || null);
    request.input('contact_person', sql.NVarChar, supplierData.contact_person || null);
    request.input('contact_phone', sql.NVarChar, supplierData.contact_phone || null);
    request.input('contact_email', sql.NVarChar, supplierData.contact_email || null);
    request.input('address', sql.NVarChar, supplierData.address || null);
    request.input('cooperation_status', sql.NVarChar, supplierData.cooperation_status || 'pending');
    request.input('audit_status', sql.NVarChar, supplierData.audit_status || 'pending');
    request.input('belong_org', sql.Int, supplierData.belong_org || null);

    const result = await request.query(`
      INSERT INTO dbo.mdm_supplier (supplier_code, supplier_name, supplier_short_name, supplier_type, qualification_level, contact_person, contact_phone, contact_email, address, cooperation_status, audit_status, belong_org)
      VALUES (@supplier_code, @supplier_name, @supplier_short_name, @supplier_type, @qualification_level, @contact_person, @contact_phone, @contact_email, @address, @cooperation_status, @audit_status, @belong_org);
      SELECT SCOPE_IDENTITY() as supplier_id;
    `);

    const supplierId = result.recordset[0].supplier_id;
    return this.getById(supplierId);
  }

  async update(supplierId, supplierData) {
    const pool = await db.getPool();
    const request = pool.request();

    request.input('supplierId', sql.Int, supplierId);
    request.input('supplier_name', sql.NVarChar, supplierData.supplier_name);
    request.input('supplier_short_name', sql.NVarChar, supplierData.supplier_short_name || null);
    request.input('supplier_type', sql.NVarChar, supplierData.supplier_type);
    request.input('qualification_level', sql.NVarChar, supplierData.qualification_level || null);
    request.input('contact_person', sql.NVarChar, supplierData.contact_person || null);
    request.input('contact_phone', sql.NVarChar, supplierData.contact_phone || null);
    request.input('contact_email', sql.NVarChar, supplierData.contact_email || null);
    request.input('address', sql.NVarChar, supplierData.address || null);
    request.input('cooperation_status', sql.NVarChar, supplierData.cooperation_status || 'pending');
    request.input('audit_status', sql.NVarChar, supplierData.audit_status || 'pending');
    request.input('belong_org', sql.Int, supplierData.belong_org || null);

    await request.query(`
      UPDATE dbo.mdm_supplier
      SET supplier_name = @supplier_name,
          supplier_short_name = @supplier_short_name,
          supplier_type = @supplier_type,
          qualification_level = @qualification_level,
          contact_person = @contact_person,
          contact_phone = @contact_phone,
          contact_email = @contact_email,
          address = @address,
          cooperation_status = @cooperation_status,
          audit_status = @audit_status,
          belong_org = @belong_org,
          update_time = GETDATE()
      WHERE supplier_id = @supplierId
    `);

    return this.getById(supplierId);
  }

  async delete(supplierId) {
    const pool = await db.getPool();
    await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query('UPDATE dbo.mdm_supplier SET is_deleted = 1, update_time = GETDATE() WHERE supplier_id = @supplierId');
    return { supplier_id: supplierId };
  }
}

module.exports = new MdmSupplierService();
