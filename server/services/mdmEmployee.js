const sql = require('mssql');
const db = require('../config/database');

class MdmEmployeeService {
  async ensureTables() {
    const pool = await db.getPool();
    const request = pool.request();

    await request.query(`
      IF OBJECT_ID('dbo.mdm_employee', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mdm_employee (
          employee_id INT IDENTITY(1,1) PRIMARY KEY,
          employee_code NVARCHAR(100) UNIQUE NOT NULL,
          employee_name NVARCHAR(100) NOT NULL,
          dept_id INT,
          position NVARCHAR(100),
          phone NVARCHAR(50),
          email NVARCHAR(100),
          status NVARCHAR(50) DEFAULT 'active',
          entry_date DATE,
          create_time DATETIME DEFAULT GETDATE(),
          update_time DATETIME DEFAULT GETDATE(),
          is_deleted BIT DEFAULT 0
        )
      END
    `);

    await request.query(`
      IF OBJECT_ID('dbo.mdm_org', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mdm_org (
          org_id INT IDENTITY(1,1) PRIMARY KEY,
          org_code NVARCHAR(100) UNIQUE NOT NULL,
          org_name NVARCHAR(255) NOT NULL,
          org_parent_id INT,
          org_type NVARCHAR(50),
          org_sort INT DEFAULT 0,
          status NVARCHAR(50) DEFAULT 'active',
          create_time DATETIME DEFAULT GETDATE(),
          update_time DATETIME DEFAULT GETDATE(),
          is_deleted BIT DEFAULT 0
        )
      END
    `);
  }

  async getAllEmployees(page = 1, limit = 20, search = '') {
    await this.ensureTables();
    const pool = await db.getPool();
    const request = pool.request();

    let whereClause = ' WHERE e.is_deleted = 0 ';
    if (search) {
      whereClause += ` AND (e.employee_name LIKE @search OR e.employee_code LIKE @search) `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const countResult = await pool.request()
      .query(`SELECT COUNT(*) as total FROM dbo.mdm_employee e ${whereClause}`);
    const total = countResult.recordset[0].total;

    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT e.*, o.org_name as dept_name
      FROM dbo.mdm_employee e
      LEFT JOIN dbo.mdm_org o ON e.dept_id = o.org_id
      ${whereClause}
      ORDER BY e.employee_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getEmployeeById(employeeId) {
    await this.ensureTables();
    const pool = await db.getPool();
    const result = await pool.request()
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT e.*, o.org_name as dept_name
        FROM dbo.mdm_employee e
        LEFT JOIN dbo.mdm_org o ON e.dept_id = o.org_id
        WHERE e.employee_id = @employeeId AND e.is_deleted = 0
      `);
    return result.recordset[0] || null;
  }

  async createEmployee(employeeData) {
    await this.ensureTables();
    const pool = await db.getPool();
    const request = pool.request();

    request.input('employee_code', sql.NVarChar, employeeData.employee_code);
    request.input('employee_name', sql.NVarChar, employeeData.employee_name);
    request.input('dept_id', sql.Int, employeeData.dept_id || null);
    request.input('position', sql.NVarChar, employeeData.position || null);
    request.input('phone', sql.NVarChar, employeeData.phone || null);
    request.input('email', sql.NVarChar, employeeData.email || null);
    request.input('status', sql.NVarChar, employeeData.status || 'active');
    request.input('entry_date', sql.Date, employeeData.entry_date || null);

    const result = await request.query(`
      INSERT INTO dbo.mdm_employee (employee_code, employee_name, dept_id, position, phone, email, status, entry_date)
      VALUES (@employee_code, @employee_name, @dept_id, @position, @phone, @email, @status, @entry_date);
      SELECT SCOPE_IDENTITY() as employee_id;
    `);

    const employeeId = result.recordset[0].employee_id;
    return this.getEmployeeById(employeeId);
  }

  async updateEmployee(employeeId, employeeData) {
    const pool = await db.getPool();
    const request = pool.request();

    request.input('employeeId', sql.Int, employeeId);
    request.input('employee_name', sql.NVarChar, employeeData.employee_name);
    request.input('dept_id', sql.Int, employeeData.dept_id || null);
    request.input('position', sql.NVarChar, employeeData.position || null);
    request.input('phone', sql.NVarChar, employeeData.phone || null);
    request.input('email', sql.NVarChar, employeeData.email || null);
    request.input('status', sql.NVarChar, employeeData.status || 'active');
    request.input('entry_date', sql.Date, employeeData.entry_date || null);

    await request.query(`
      UPDATE dbo.mdm_employee
      SET employee_name = @employee_name,
          dept_id = @dept_id,
          position = @position,
          phone = @phone,
          email = @email,
          status = @status,
          entry_date = @entry_date,
          update_time = GETDATE()
      WHERE employee_id = @employeeId
    `);

    return this.getEmployeeById(employeeId);
  }

  async deleteEmployee(employeeId) {
    const pool = await db.getPool();
    await pool.request()
      .input('employeeId', sql.Int, employeeId)
      .query('UPDATE dbo.mdm_employee SET is_deleted = 1, update_time = GETDATE() WHERE employee_id = @employeeId');
    return { employee_id: employeeId };
  }

  async getAllOrgs(search = '') {
    await this.ensureTables();
    const pool = await db.getPool();

    let whereClause = ' WHERE is_deleted = 0 ';
    if (search) {
      const result = await pool.request()
        .input('search', sql.NVarChar, `%${search}%`)
        .query(`SELECT * FROM dbo.mdm_org ${whereClause} AND org_name LIKE @search ORDER BY org_sort, org_id`);
      return result.recordset;
    }

    const result = await pool.request()
      .query(`SELECT * FROM dbo.mdm_org ${whereClause} ORDER BY org_sort, org_id`);
    return result.recordset;
  }

  async getOrgTree() {
    await this.ensureTables();
    const pool = await db.getPool();
    const result = await pool.request()
      .query('SELECT * FROM dbo.mdm_org WHERE is_deleted = 0 ORDER BY org_sort, org_id');

    const orgs = result.recordset;
    const tree = [];
    const map = {};

    orgs.forEach(org => {
      map[org.org_id] = { ...org, children: [] };
    });

    orgs.forEach(org => {
      if (org.org_parent_id && map[org.org_parent_id]) {
        map[org.org_parent_id].children.push(map[org.org_id]);
      } else {
        tree.push(map[org.org_id]);
      }
    });

    return tree;
  }

  async createOrg(orgData) {
    await this.ensureTables();
    const pool = await db.getPool();
    const request = pool.request();

    request.input('org_code', sql.NVarChar, orgData.org_code);
    request.input('org_name', sql.NVarChar, orgData.org_name);
    request.input('org_parent_id', sql.Int, orgData.org_parent_id || null);
    request.input('org_type', sql.NVarChar, orgData.org_type || 'department');
    request.input('org_sort', sql.Int, orgData.org_sort || 0);
    request.input('status', sql.NVarChar, orgData.status || 'active');

    const result = await request.query(`
      INSERT INTO dbo.mdm_org (org_code, org_name, org_parent_id, org_type, org_sort, status)
      VALUES (@org_code, @org_name, @org_parent_id, @org_type, @org_sort, @status);
      SELECT SCOPE_IDENTITY() as org_id;
    `);

    const orgId = result.recordset[0].org_id;
    const orgResult = await pool.request()
      .input('orgId', sql.Int, orgId)
      .query('SELECT * FROM dbo.mdm_org WHERE org_id = @orgId');
    return orgResult.recordset[0];
  }

  async updateOrg(orgId, orgData) {
    const pool = await db.getPool();
    const request = pool.request();

    request.input('orgId', sql.Int, orgId);
    request.input('org_name', sql.NVarChar, orgData.org_name);
    request.input('org_parent_id', sql.Int, orgData.org_parent_id || null);
    request.input('org_type', sql.NVarChar, orgData.org_type);
    request.input('org_sort', sql.Int, orgData.org_sort || 0);
    request.input('status', sql.NVarChar, orgData.status || 'active');

    await request.query(`
      UPDATE dbo.mdm_org
      SET org_name = @org_name,
          org_parent_id = @org_parent_id,
          org_type = @org_type,
          org_sort = @org_sort,
          status = @status,
          update_time = GETDATE()
      WHERE org_id = @orgId
    `);

    const orgResult = await pool.request()
      .input('orgId', sql.Int, orgId)
      .query('SELECT * FROM dbo.mdm_org WHERE org_id = @orgId');
    return orgResult.recordset[0];
  }

  async deleteOrg(orgId) {
    const pool = await db.getPool();
    await pool.request()
      .input('orgId', sql.Int, orgId)
      .query('UPDATE dbo.mdm_org SET is_deleted = 1, update_time = GETDATE() WHERE org_id = @orgId');
    return { org_id: orgId };
  }

  async syncFromHR(employees, orgs) {
    await this.ensureTables();
    const pool = await db.getPool();

    for (const emp of employees) {
      const existing = await pool.request()
        .input('employee_code', sql.NVarChar, emp.employee_code)
        .query('SELECT employee_id FROM dbo.mdm_employee WHERE employee_code = @employee_code AND is_deleted = 0');

      if (existing.recordset.length > 0) {
        await pool.request()
          .input('employee_id', sql.Int, existing.recordset[0].employee_id)
          .input('employee_name', sql.NVarChar, emp.employee_name)
          .input('dept_id', sql.Int, emp.dept_id || null)
          .input('position', sql.NVarChar, emp.position || null)
          .input('phone', sql.NVarChar, emp.phone || null)
          .input('email', sql.NVarChar, emp.email || null)
          .input('status', sql.NVarChar, emp.status || 'active')
          .query(`
            UPDATE dbo.mdm_employee
            SET employee_name = @employee_name, dept_id = @dept_id, position = @position,
                phone = @phone, email = @email, status = @status, update_time = GETDATE()
            WHERE employee_id = @employee_id
          `);
      } else {
        await pool.request()
          .input('employee_code', sql.NVarChar, emp.employee_code)
          .input('employee_name', sql.NVarChar, emp.employee_name)
          .input('dept_id', sql.Int, emp.dept_id || null)
          .input('position', sql.NVarChar, emp.position || null)
          .input('phone', sql.NVarChar, emp.phone || null)
          .input('email', sql.NVarChar, emp.email || null)
          .input('status', sql.NVarChar, emp.status || 'active')
          .query(`
            INSERT INTO dbo.mdm_employee (employee_code, employee_name, dept_id, position, phone, email, status)
            VALUES (@employee_code, @employee_name, @dept_id, @position, @phone, @email, @status)
          `);
      }
    }

    for (const org of orgs) {
      const existing = await pool.request()
        .input('org_code', sql.NVarChar, org.org_code)
        .query('SELECT org_id FROM dbo.mdm_org WHERE org_code = @org_code AND is_deleted = 0');

      if (existing.recordset.length > 0) {
        await pool.request()
          .input('org_id', sql.Int, existing.recordset[0].org_id)
          .input('org_name', sql.NVarChar, org.org_name)
          .input('org_parent_id', sql.Int, org.org_parent_id || null)
          .input('org_type', sql.NVarChar, org.org_type || 'department')
          .input('org_sort', sql.Int, org.org_sort || 0)
          .input('status', sql.NVarChar, org.status || 'active')
          .query(`
            UPDATE dbo.mdm_org
            SET org_name = @org_name, org_parent_id = @org_parent_id, org_type = @org_type,
                org_sort = @org_sort, status = @status, update_time = GETDATE()
            WHERE org_id = @org_id
          `);
      } else {
        await pool.request()
          .input('org_code', sql.NVarChar, org.org_code)
          .input('org_name', sql.NVarChar, org.org_name)
          .input('org_parent_id', sql.Int, org.org_parent_id || null)
          .input('org_type', sql.NVarChar, org.org_type || 'department')
          .input('org_sort', sql.Int, org.org_sort || 0)
          .input('status', sql.NVarChar, org.status || 'active')
          .query(`
            INSERT INTO dbo.mdm_org (org_code, org_name, org_parent_id, org_type, org_sort, status)
            VALUES (@org_code, @org_name, @org_parent_id, @org_type, @org_sort, @status)
          `);
      }
    }

    return { synced_employees: employees.length, synced_orgs: orgs.length };
  }
}

module.exports = new MdmEmployeeService();
