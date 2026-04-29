-- 执行客户合同与回款表创建
const sql = require('mssql');
const { getPool } = require('../config/database');

async function setupCustomerContracts() {
  const pool = await getPool();

  // 创建客户合同表
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_contracts' AND xtype='U')
    BEGIN
      CREATE TABLE customer_contracts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        contract_code NVARCHAR(100) NOT NULL UNIQUE,
        contract_name NVARCHAR(200) NOT NULL,
        customer_id INT NOT NULL,
        opportunity_id INT,
        sales_id INT,
        contract_amount DECIMAL(18,2) DEFAULT 0,
        received_amount DECIMAL(18,2) DEFAULT 0,
        unpaid_amount DECIMAL(18,2) DEFAULT 0,
        signing_date DATE,
        start_date DATE,
        end_date DATE,
        contract_status NVARCHAR(50) DEFAULT 'draft',
        payment_status NVARCHAR(50) DEFAULT 'pending',
        payment_terms NVARCHAR(500),
        delivery_conditions NVARCHAR(500),
        quality_guarantee_period INT,
        contract_file_urls NVARCHAR(MAX),
        remarks NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT
      );
      CREATE INDEX idx_contract_customer ON customer_contracts(customer_id);
      CREATE INDEX idx_contract_code ON customer_contracts(contract_code);
      CREATE INDEX idx_contract_status ON customer_contracts(contract_status);
      CREATE INDEX idx_contract_payment_status ON customer_contracts(payment_status);
      PRINT 'customer_contracts表创建成功';
    END
  `);

  // 创建回款计划表
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='contract_payment_plans' AND xtype='U')
    BEGIN
      CREATE TABLE contract_payment_plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        contract_id INT NOT NULL,
        plan_no INT NOT NULL,
        plan_amount DECIMAL(18,2) NOT NULL,
        plan_date DATE NOT NULL,
        payment_type NVARCHAR(50),
        payment_method NVARCHAR(50),
        invoice_no NVARCHAR(100),
        actual_amount DECIMAL(18,2),
        actual_date DATE,
        received_amount DECIMAL(18,2) DEFAULT 0,
        plan_status NVARCHAR(50) DEFAULT 'pending',
        remarks NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );
      CREATE INDEX idx_plan_contract ON contract_payment_plans(contract_id);
      CREATE INDEX idx_plan_status ON contract_payment_plans(plan_status);
      PRINT 'contract_payment_plans表创建成功';
    END
  `);

  // 创建回款记录表
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='contract_payment_records' AND xtype='U')
    BEGIN
      CREATE TABLE contract_payment_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        contract_id INT NOT NULL,
        plan_id INT,
        payment_no NVARCHAR(50),
        payment_amount DECIMAL(18,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method NVARCHAR(50),
        payment_type NVARCHAR(50),
        invoice_no NVARCHAR(100),
        invoice_amount DECIMAL(18,2),
        bank_info NVARCHAR(200),
        received_by INT,
        confirm_by INT,
        confirm_date DATE,
        record_status NVARCHAR(50) DEFAULT 'confirmed',
        remarks NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
      );
      CREATE INDEX idx_record_contract ON contract_payment_records(contract_id);
      CREATE INDEX idx_record_date ON contract_payment_records(payment_date);
      PRINT 'contract_payment_records表创建成功';
    END
  `);

  console.log('客户合同与回款表初始化完成');
}

setupCustomerContracts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('初始化失败:', err);
    process.exit(1);
  });
