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

  await request.query(`
    IF OBJECT_ID('dbo.sys_org','U') IS NULL
    BEGIN
      CREATE TABLE dbo.sys_org (
        org_id INT PRIMARY KEY,
        org_name NVARCHAR(255),
        org_parent_id INT,
        org_type NVARCHAR(50),
        org_sort INT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'active',
        create_time DATETIME DEFAULT GETDATE(),
        update_time DATETIME DEFAULT GETDATE()
      )
    END
  `);

  await request.query(`
    IF OBJECT_ID('dbo.mdm_supplier','U') IS NULL
    BEGIN
      CREATE TABLE dbo.mdm_supplier (
        supplier_id INT PRIMARY KEY,
        supplier_name NVARCHAR(255),
        supplier_short_name NVARCHAR(255),
        supplier_type NVARCHAR(50),
        qualification_level NVARCHAR(50),
        contact_person NVARCHAR(100),
        contact_phone NVARCHAR(50),
        contact_email NVARCHAR(100),
        address NVARCHAR(500),
        cooperation_status NVARCHAR(50),
        audit_status NVARCHAR(50),
        belong_org INT,
        create_time DATETIME DEFAULT GETDATE(),
        update_time DATETIME DEFAULT GETDATE()
      )
    END
  `);

  await request.query(`
    IF OBJECT_ID('dbo.mdm_product','U') IS NULL
    BEGIN
      CREATE TABLE dbo.mdm_product (
        product_id INT PRIMARY KEY,
        product_name NVARCHAR(255),
        product_code NVARCHAR(100),
        product_category NVARCHAR(100),
        spec NVARCHAR(255),
        unit NVARCHAR(50),
        cost_price DECIMAL(18,2),
        sale_price DECIMAL(18,2),
        supplier_id INT,
        stock_warning_num INT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'active',
        create_time DATETIME DEFAULT GETDATE(),
        update_time DATETIME DEFAULT GETDATE()
      )
    END
  `);

  console.log('[masterDataSync] All tables ensured (org, supplier, product added)');
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

async function upsertOrg(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('org_id', db.sql.Int, entityData.org_id)
      .input('org_name', db.sql.NVarChar, entityData.org_name || null)
      .input('org_parent_id', db.sql.Int, entityData.org_parent_id || null)
      .input('org_type', db.sql.NVarChar, entityData.org_type || null)
      .input('org_sort', db.sql.Int, entityData.org_sort || 0)
      .input('status', db.sql.NVarChar, entityData.status || 'active')
      .query(`
        UPDATE dbo.sys_org SET
          org_name = @org_name, org_parent_id = @org_parent_id, org_type = @org_type,
          org_sort = @org_sort, status = @status, update_time = GETDATE()
        WHERE org_id = @org_id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.sys_org (org_id, org_name, org_parent_id, org_type, org_sort, status, create_time, update_time)
          VALUES (@org_id, @org_name, @org_parent_id, @org_type, @org_sort, @status, GETDATE(), GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted org ${entityData.org_id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert org failed:', err);
  }
}

async function deleteOrg(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('org_id', db.sql.Int, entityData.org_id)
      .query('DELETE FROM dbo.sys_org WHERE org_id = @org_id');
    console.log(`[masterDataSync] Deleted org ${entityData.org_id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete org failed:', err);
  }
}

async function upsertSupplier(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('supplier_id', db.sql.Int, entityData.supplier_id)
      .input('supplier_name', db.sql.NVarChar, entityData.supplier_name || null)
      .input('supplier_short_name', db.sql.NVarChar, entityData.supplier_short_name || null)
      .input('supplier_type', db.sql.NVarChar, entityData.supplier_type || null)
      .input('qualification_level', db.sql.NVarChar, entityData.qualification_level || null)
      .input('contact_person', db.sql.NVarChar, entityData.contact_person || null)
      .input('contact_phone', db.sql.NVarChar, entityData.contact_phone || null)
      .input('contact_email', db.sql.NVarChar, entityData.contact_email || null)
      .input('address', db.sql.NVarChar, entityData.address || null)
      .input('cooperation_status', db.sql.NVarChar, entityData.cooperation_status || null)
      .input('audit_status', db.sql.NVarChar, entityData.audit_status || null)
      .input('belong_org', db.sql.Int, entityData.belong_org || null)
      .query(`
        UPDATE dbo.mdm_supplier SET
          supplier_name = @supplier_name, supplier_short_name = @supplier_short_name,
          supplier_type = @supplier_type, qualification_level = @qualification_level,
          contact_person = @contact_person, contact_phone = @contact_phone,
          contact_email = @contact_email, address = @address,
          cooperation_status = @cooperation_status, audit_status = @audit_status,
          belong_org = @belong_org, update_time = GETDATE()
        WHERE supplier_id = @supplier_id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.mdm_supplier (supplier_id, supplier_name, supplier_short_name, supplier_type,
            qualification_level, contact_person, contact_phone, contact_email, address,
            cooperation_status, audit_status, belong_org, create_time, update_time)
          VALUES (@supplier_id, @supplier_name, @supplier_short_name, @supplier_type,
            @qualification_level, @contact_person, @contact_phone, @contact_email, @address,
            @cooperation_status, @audit_status, @belong_org, GETDATE(), GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted supplier ${entityData.supplier_id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert supplier failed:', err);
  }
}

async function deleteSupplier(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('supplier_id', db.sql.Int, entityData.supplier_id)
      .query('DELETE FROM dbo.mdm_supplier WHERE supplier_id = @supplier_id');
    console.log(`[masterDataSync] Deleted supplier ${entityData.supplier_id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete supplier failed:', err);
  }
}

async function upsertProduct(event) {
  try {
    const { entityData, operator } = event;
    const pool = await db.getPool();

    await pool.request()
      .input('product_id', db.sql.Int, entityData.product_id)
      .input('product_name', db.sql.NVarChar, entityData.product_name || null)
      .input('product_code', db.sql.NVarChar, entityData.product_code || null)
      .input('product_category', db.sql.NVarChar, entityData.product_category || null)
      .input('spec', db.sql.NVarChar, entityData.spec || null)
      .input('unit', db.sql.NVarChar, entityData.unit || null)
      .input('cost_price', db.sql.Decimal(18,2), entityData.cost_price || 0)
      .input('sale_price', db.sql.Decimal(18,2), entityData.sale_price || 0)
      .input('supplier_id', db.sql.Int, entityData.supplier_id || null)
      .input('stock_warning_num', db.sql.Int, entityData.stock_warning_num || 0)
      .input('status', db.sql.NVarChar, entityData.status || 'active')
      .query(`
        UPDATE dbo.mdm_product SET
          product_name = @product_name, product_code = @product_code,
          product_category = @product_category, spec = @spec, unit = @unit,
          cost_price = @cost_price, sale_price = @sale_price, supplier_id = @supplier_id,
          stock_warning_num = @stock_warning_num, status = @status, update_time = GETDATE()
        WHERE product_id = @product_id;
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.mdm_product (product_id, product_name, product_code, product_category,
            spec, unit, cost_price, sale_price, supplier_id, stock_warning_num, status, create_time, update_time)
          VALUES (@product_id, @product_name, @product_code, @product_category,
            @spec, @unit, @cost_price, @sale_price, @supplier_id, @stock_warning_num, @status, GETDATE(), GETDATE());
        END
      `);

    console.log(`[masterDataSync] Upserted product ${entityData.product_id}, operator: ${operator}`);
  } catch (err) {
    console.error('[masterDataSync] Upsert product failed:', err);
  }
}

async function deleteProduct(event) {
  try {
    const { entityData } = event;
    const pool = await db.getPool();
    await pool.request()
      .input('product_id', db.sql.Int, entityData.product_id)
      .query('DELETE FROM dbo.mdm_product WHERE product_id = @product_id');
    console.log(`[masterDataSync] Deleted product ${entityData.product_id}`);
  } catch (err) {
    console.error('[masterDataSync] Delete product failed:', err);
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

    eventBus.subscribe('mdms.org.create', upsertOrg);
    eventBus.subscribe('mdms.org.update', upsertOrg);
    eventBus.subscribe('mdms.org.delete', deleteOrg);

    eventBus.subscribe('mdms.supplier.create', upsertSupplier);
    eventBus.subscribe('mdms.supplier.update', upsertSupplier);
    eventBus.subscribe('mdms.supplier.delete', deleteSupplier);

    eventBus.subscribe('mdms.product.create', upsertProduct);
    eventBus.subscribe('mdms.product.update', upsertProduct);
    eventBus.subscribe('mdms.product.delete', deleteProduct);

    console.log('[masterDataSync] Started and subscribed to all master data events (org, supplier, product added)');
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
  deleteDepartment,
  upsertOrg,
  deleteOrg,
  upsertSupplier,
  deleteSupplier,
  upsertProduct,
  deleteProduct
};
