-- 客户合同与回款关联表
-- 用于管理客户合同、合同金额、签约日期、回款计划、实际回款

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
        updated_by INT,

        CONSTRAINT FK_contract_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT FK_contract_opportunity FOREIGN KEY (opportunity_id) REFERENCES customer_opportunities(id),
        CONSTRAINT FK_contract_sales FOREIGN KEY (sales_id) REFERENCES sys_users(id)
    );

    CREATE INDEX idx_contract_customer ON customer_contracts(customer_id);
    CREATE INDEX idx_contract_code ON customer_contracts(contract_code);
    CREATE INDEX idx_contract_status ON customer_contracts(contract_status);
    CREATE INDEX idx_contract_payment_status ON customer_contracts(payment_status);

    PRINT 'customer_contracts表创建成功';
END
ELSE
BEGIN
    PRINT 'customer_contracts表已存在';
END
GO

-- 回款计划表
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
        updated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_plan_contract FOREIGN KEY (contract_id) REFERENCES customer_contracts(id)
    );

    CREATE INDEX idx_plan_contract ON contract_payment_plans(contract_id);
    CREATE INDEX idx_plan_status ON contract_payment_plans(plan_status);

    PRINT 'contract_payment_plans表创建成功';
END
ELSE
BEGIN
    PRINT 'contract_payment_plans表已存在';
END
GO

-- 回款记录表
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
        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_record_contract FOREIGN KEY (contract_id) REFERENCES customer_contracts(id),
        CONSTRAINT FK_record_plan FOREIGN KEY (plan_id) REFERENCES contract_payment_plans(id)
    );

    CREATE INDEX idx_record_contract ON contract_payment_records(contract_id);
    CREATE INDEX idx_record_date ON contract_payment_records(payment_date);

    PRINT 'contract_payment_records表创建成功';
END
ELSE
BEGIN
    PRINT 'contract_payment_records表已存在';
END
GO

-- 合同到期预警视图
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='view_contract_expiring' AND xtype='V')
BEGIN
    EXEC('
    CREATE VIEW view_contract_expiring AS
    SELECT
        c.id, c.contract_code, c.contract_name,
        c.customer_id, ct.name as customer_name,
        c.contract_amount, c.end_date,
        DATEDIFF(DAY, GETDATE(), c.end_date) as days_remaining,
        CASE
            WHEN DATEDIFF(DAY, GETDATE(), c.end_date) < 0 THEN ''已到期''
            WHEN DATEDIFF(DAY, GETDATE(), c.end_date) <= 30 THEN ''即将到期''
            WHEN DATEDIFF(DAY, GETDATE(), c.end_date) <= 90 THEN ''三个月内到期''
            ELSE ''正常''
        END as expire_status
    FROM customer_contracts c
    LEFT JOIN customers ct ON c.customer_id = ct.id
    WHERE c.contract_status = ''active''
    ');
    PRINT 'view_contract_expiring视图创建成功';
END
GO

PRINT '客户合同与回款相关表创建完成';
