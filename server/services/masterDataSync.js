const eventBus = require('./eventBus');
const db = require('../config/database');
const { BUSINESS_TYPES, EVENT_ACTIONS } = require('./eventSchema');

async function ensureTables() {
  const pool = await db.getPool();
  const request = pool.request();

  await request.query(`
    IF OBJECT_ID('dbo.md_customers','U') IS NULL
    BEGIN
      CREATE TABLE dbo.md_customers (
        id INT PRIMARY KEY,
        code NVARCHAR(50),
        name NVARCHAR(255),
        short_name NVARCHAR(255),
        sales_id INT,
        status NVARCHAR(50),
        customer_type NVARCHAR(50),
        updated_at DATETIME DEFAULT GETDATE()
      )
    END
  `);

  await request.query(`
    IF OBJECT_ID('dbo.md_employees','U') IS NULL
    BEGIN
      CREATE TABLE dbo.md_employees (
        id INT PRIMARY KEY,
        employee_no NVARCHAR(50),
        name NVARCHAR(100),
        gender NVARCHAR(10),
        position NVARCHAR(100),
        department_id INT,
        department_name NVARCHAR(100),
        team_id INT,
        team_name NVARCHAR(100),
        email NVARCHAR(100),
        phone NVARCHAR(50),
        status NVARCHAR(20),
        join_date DATE,
        updated_at DATETIME DEFAULT GETDATE()
      )
    END
  `);

  await request.query(`
    IF OBJECT_ID('dbo.md_departments','U') IS NULL
    BEGIN
      CREATE TABLE dbo.md_departments (
        id INT PRIMARY KEY,
        department_code NVARCHAR(50),
        name NVARCHAR(100),
        manager NVARCHAR(100),
        headcount INT,
        parent_id INT,
        level INT,
        status NVARCHAR(20),
        updated_at DATETIME DEFAULT GETDATE()
      )
    END
  `);

  console.log('[masterDataSync] Tables ensured');
}

async function upsertCustomer(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .input('code', db.sql.NVarChar, entityData.code || null)
      .input('name', db.sql.NVarChar, entityData.name || null)
      .input('short_name', db.sql.NVarChar, entityData.short_name || null)
      .input('sales_id', db.sql.Int, entityData.sales_id || null)
      .input('status', db.sql.NVarChar, entityData.status || 'active')
      .input('customer_type', db.sql.NVarChar, entityData.customer_type || null)
      .query(`
        UPDATE dbo.md_customers SET
          code = @code, name = @name, short_name = @short_name,
          sales_id = @sales_id, status = @status, customer_type = @customer_type,
          updated_at = GETDATE()
        WHERE id = @id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.md_customers (id, code, name, short_name, sales_id, status, customer_type, updated_at)
          VALUES (@id, @code, @name, @short_name, @sales_id, @status, @customer_type, GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted customer ${entityData.id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert customer failed:', err);
  }
}

async function deleteCustomer(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .query('DELETE FROM dbo.md_customers WHERE id = @id');
    console.log(`[masterDataSync] Deleted customer ${entityData.id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete customer failed:', err);
  }
}

async function upsertEmployee(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .input('employee_no', db.sql.NVarChar, entityData.employee_no || null)
      .input('name', db.sql.NVarChar, entityData.name || null)
      .input('gender', db.sql.NVarChar, entityData.gender || null)
      .input('position', db.sql.NVarChar, entityData.position || null)
      .input('department_id', db.sql.Int, entityData.department_id || null)
      .input('department_name', db.sql.NVarChar, entityData.department_name || null)
      .input('team_id', db.sql.Int, entityData.team_id || null)
      .input('team_name', db.sql.NVarChar, entityData.team_name || null)
      .input('email', db.sql.NVarChar, entityData.email || null)
      .input('phone', db.sql.NVarChar, entityData.phone || null)
      .input('status', db.sql.NVarChar, entityData.status || 'active')
      .input('join_date', db.sql.Date, entityData.join_date || null)
      .query(`
        UPDATE dbo.md_employees SET
          employee_no = @employee_no, name = @name, gender = @gender,
          position = @position, department_id = @department_id, department_name = @department_name,
          team_id = @team_id, team_name = @team_name, email = @email, phone = @phone,
          status = @status, join_date = @join_date, updated_at = GETDATE()
        WHERE id = @id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.md_employees (id, employee_no, name, gender, position, department_id, department_name,
            team_id, team_name, email, phone, status, join_date, updated_at)
          VALUES (@id, @employee_no, @name, @gender, @position, @department_id, @department_name,
            @team_id, @team_name, @email, @phone, @status, @join_date, GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted employee ${entityData.id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert employee failed:', err);
  }
}

async function deleteEmployee(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .query('DELETE FROM dbo.md_employees WHERE id = @id');
    console.log(`[masterDataSync] Deleted employee ${entityData.id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete employee failed:', err);
  }
}

async function upsertDepartment(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .input('department_code', db.sql.NVarChar, entityData.department_code || null)
      .input('name', db.sql.NVarChar, entityData.name || null)
      .input('manager', db.sql.NVarChar, entityData.manager || null)
      .input('headcount', db.sql.Int, entityData.headcount || 0)
      .input('parent_id', db.sql.Int, entityData.parent_id || null)
      .input('level', db.sql.Int, entityData.level || 1)
      .input('status', db.sql.NVarChar, entityData.status || 'active')
      .query(`
        UPDATE dbo.md_departments SET
          department_code = @department_code, name = @name, manager = @manager,
          headcount = @headcount, parent_id = @parent_id, level = @level,
          status = @status, updated_at = GETDATE()
        WHERE id = @id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.md_departments (id, department_code, name, manager, headcount, parent_id, level, status, updated_at)
          VALUES (@id, @department_code, @name, @manager, @headcount, @parent_id, @level, @status, GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted department ${entityData.id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert department failed:', err);
  }
}

async function deleteDepartment(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('id', db.sql.Int, entityData.id)
      .query('DELETE FROM dbo.md_departments WHERE id = @id');
    console.log(`[masterDataSync] Deleted department ${entityData.id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete department failed:', err);
  }
}

async function start() {
  try {
    await ensureTables();

    eventBus.subscribe('mdms.customer.create', upsertCustomer);
    eventBus.subscribe('mdms.customer.update', upsertCustomer);
    eventBus.subscribe('mdms.customer.delete', deleteCustomer);

    eventBus.subscribe('mdms.employee.create', upsertEmployee);
    eventBus.subscribe('mdms.employee.update', upsertEmployee);
    eventBus.subscribe('mdms.employee.delete', deleteEmployee);

    eventBus.subscribe('mdms.department.create', upsertDepartment);
    eventBus.subscribe('mdms.department.update', upsertDepartment);
    eventBus.subscribe('mdms.department.delete', deleteDepartment);

    console.log('[masterDataSync] Started and subscribed to all master data events');
  } catch (err) {
    console.error('[masterDataSync] Start failed:', err);
  }
}

start();

module.exports = {
  upsertCustomer,
  deleteCustomer,
  upsertEmployee,
  deleteEmployee,
  upsertDepartment,
  deleteDepartment
};
