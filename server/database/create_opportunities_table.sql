-- 商机项目跟进表
-- 阶段：初步接洽->需求确认->方案报价->技术评审->商务谈判->成交->丢单

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_opportunities' AND xtype='U')
BEGIN
    CREATE TABLE customer_opportunities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        opportunity_code NVARCHAR(50) NOT NULL,
        name NVARCHAR(200) NOT NULL,
        customer_id INT NOT NULL,
        sales_id INT,
        contact_person NVARCHAR(100),
        contact_phone NVARCHAR(50),
        contact_email NVARCHAR(100),

        -- 阶段管理
        stage NVARCHAR(50) DEFAULT 'initial_contact',  -- initial_contact/requirements/quotation/technical_review/business_negotiation/won/lost
        stage_name NVARCHAR(100),

        -- 商机信息
        equipment_requirements NVARCHAR(MAX),  -- 设备需求
        production_capacity NVARCHAR(200),       -- 产能情况
        budget_amount DECIMAL(18,2),              -- 预算金额
        delivery_cycle INT,                       -- 交付周期(天)
        expected_signing_date DATE,               -- 预计签约日期

        -- 竞争对手
        competitor_info NVARCHAR(MAX),
        competitor_advantage NVARCHAR(MAX),
        competitor_disadvantage NVARCHAR(MAX),

        -- 丢单原因
        lost_reason NVARCHAR(MAX),
        lost_competitor NVARCHAR(200),

        -- 关联文件
        proposal_document NVARCHAR(500),
        technical_agreement NVARCHAR(500),
        contract_document NVARCHAR(500),

        -- 备注
        remarks NVARCHAR(MAX),

        -- 状态
        status NVARCHAR(50) DEFAULT 'active',  -- active/progress/closed/won/lost
        priority NVARCHAR(50) DEFAULT 'normal', -- urgent/important/normal/low

        -- 审计字段
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,

        -- 约束
        CONSTRAINT FK_opportunity_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT FK_opportunity_sales FOREIGN KEY (sales_id) REFERENCES sys_users(id)
    );

    -- 创建索引
    CREATE INDEX idx_opportunity_customer ON customer_opportunities(customer_id);
    CREATE INDEX idx_opportunity_sales ON customer_opportunities(sales_id);
    CREATE INDEX idx_opportunity_stage ON customer_opportunities(stage);
    CREATE INDEX idx_opportunity_status ON customer_opportunities(status);

    PRINT 'customer_opportunities表创建成功';
END
ELSE
BEGIN
    PRINT 'customer_opportunities表已存在';
END
GO
