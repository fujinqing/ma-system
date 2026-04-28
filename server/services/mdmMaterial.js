const sql = require('mssql');
const db = require('../config/database');

class MdmMaterialService {
  async ensureTable() {
    const pool = await db.getPool();
    const request = pool.request();
    await request.query(`
      IF OBJECT_ID('dbo.mdm_material', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mdm_material (
          material_id INT IDENTITY(1,1) PRIMARY KEY,
          material_code NVARCHAR(100) UNIQUE NOT NULL,
          material_name NVARCHAR(255) NOT NULL,
          material_category NVARCHAR(100),
          spec NVARCHAR(255),
          unit NVARCHAR(50),
          cost_price DECIMAL(18,2),
          supplier_id INT,
          warehouse_id INT,
          stock_warning_num INT DEFAULT 0,
          status NVARCHAR(50) DEFAULT 'active',
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
      whereClause += ` AND (material_name LIKE @search OR material_code LIKE @search) `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const countRequest = pool.request();
    if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
    const countResult = await countRequest.query(
      `SELECT COUNT(*) as total FROM dbo.mdm_material ${whereClause}`
    );
    const total = countResult.recordset[0].total;

    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT * FROM dbo.mdm_material ${whereClause}
      ORDER BY material_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(materialId) {
    await this.ensureTable();
    const pool = await db.getPool();
    const result = await pool.request()
      .input('materialId', sql.Int, materialId)
      .query('SELECT * FROM dbo.mdm_material WHERE material_id = @materialId AND is_deleted = 0');
    return result.recordset[0] || null;
  }

  async create(materialData) {
    await this.ensureTable();
    const pool = await db.getPool();
    const request = pool.request();

    request.input('material_code', sql.NVarChar, materialData.material_code);
    request.input('material_name', sql.NVarChar, materialData.material_name);
    request.input('material_category', sql.NVarChar, materialData.material_category || null);
    request.input('spec', sql.NVarChar, materialData.spec || null);
    request.input('unit', sql.NVarChar, materialData.unit || null);
    request.input('cost_price', sql.Decimal(18,2), materialData.cost_price || 0);
    request.input('supplier_id', sql.Int, materialData.supplier_id || null);
    request.input('warehouse_id', sql.Int, materialData.warehouse_id || null);
    request.input('stock_warning_num', sql.Int, materialData.stock_warning_num || 0);
    request.input('status', sql.NVarChar, materialData.status || 'active');

    const result = await request.query(`
      INSERT INTO dbo.mdm_material (material_code, material_name, material_category, spec, unit, cost_price, supplier_id, warehouse_id, stock_warning_num, status)
      VALUES (@material_code, @material_name, @material_category, @spec, @unit, @cost_price, @supplier_id, @warehouse_id, @stock_warning_num, @status);
      SELECT SCOPE_IDENTITY() as material_id;
    `);

    const materialId = result.recordset[0].material_id;
    return this.getById(materialId);
  }

  async update(materialId, materialData) {
    const pool = await db.getPool();
    const request = pool.request();

    request.input('materialId', sql.Int, materialId);
    request.input('material_name', sql.NVarChar, materialData.material_name);
    request.input('material_category', sql.NVarChar, materialData.material_category || null);
    request.input('spec', sql.NVarChar, materialData.spec || null);
    request.input('unit', sql.NVarChar, materialData.unit || null);
    request.input('cost_price', sql.Decimal(18,2), materialData.cost_price);
    request.input('supplier_id', sql.Int, materialData.supplier_id || null);
    request.input('warehouse_id', sql.Int, materialData.warehouse_id || null);
    request.input('stock_warning_num', sql.Int, materialData.stock_warning_num || 0);
    request.input('status', sql.NVarChar, materialData.status || 'active');

    await request.query(`
      UPDATE dbo.mdm_material
      SET material_name = @material_name,
          material_category = @material_category,
          spec = @spec,
          unit = @unit,
          cost_price = @cost_price,
          supplier_id = @supplier_id,
          warehouse_id = @warehouse_id,
          stock_warning_num = @stock_warning_num,
          status = @status,
          update_time = GETDATE()
      WHERE material_id = @materialId
    `);

    return this.getById(materialId);
  }

  async delete(materialId) {
    const pool = await db.getPool();
    await pool.request()
      .input('materialId', sql.Int, materialId)
      .query('UPDATE dbo.mdm_material SET is_deleted = 1, update_time = GETDATE() WHERE material_id = @materialId');
    return { material_id: materialId };
  }
}

module.exports = new MdmMaterialService();
