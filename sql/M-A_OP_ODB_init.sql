-- =====================================================
-- M-A_OP_ODB 数据库初始化脚本
-- 数据库名: M-A_OP_ODB
-- 描述: 曼弗莱德智能制造运营数据库
-- 创建日期: 2026-03-24
-- =====================================================

-- 创建数据库（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'M-A_OP_ODB')
BEGIN
    CREATE DATABASE [M-A_OP_ODB];
END
GO

USE [M-A_OP_ODB];
GO

-- =====================================================
-- 1. 用户与权限模块
-- =====================================================

-- 部门表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('departments') AND type in (N'U'))
BEGIN
    CREATE TABLE departments (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        icon NVARCHAR(50),
        color NVARCHAR(20),
        manager NVARCHAR(100),
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (parent_id) REFERENCES departments(id)
    );
END
GO

-- 用户表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('users') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        username NVARCHAR(50) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        role NVARCHAR(20) DEFAULT 'employee',
        department_id INT,
        position NVARCHAR(100),
        phone NVARCHAR(20),
        email NVARCHAR(100),
        status INT DEFAULT 1,
        sales_id INT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    );
END
GO

-- 用户权限表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('user_permissions') AND type in (N'U'))
BEGIN
    CREATE TABLE user_permissions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        module NVARCHAR(50) NOT NULL,
        permission_type NVARCHAR(20) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- 审计日志表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('audit_logs') AND type in (N'U'))
BEGIN
    CREATE TABLE audit_logs (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        action NVARCHAR(100) NOT NULL,
        details NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IX_audit_logs_action ON audit_logs(action);
    CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);
END
GO

-- =====================================================
-- 2. 采购管理模块
-- =====================================================

-- 审批表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('approvals') AND type in (N'U'))
BEGIN
    CREATE TABLE approvals (
        id INT PRIMARY KEY IDENTITY(1,1),
        document_type NVARCHAR(50) NOT NULL,
        document_id INT NOT NULL,
        approver_id INT,
        status NVARCHAR(20) DEFAULT 'pending',
        comments NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (approver_id) REFERENCES users(id)
    );
END
GO

-- 供应商表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('suppliers') AND type in (N'U'))
BEGIN
    CREATE TABLE suppliers (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(200) NOT NULL,
        code NVARCHAR(50) UNIQUE,
        contact_person NVARCHAR(100),
        contact_phone NVARCHAR(20),
        contact_email NVARCHAR(100),
        address NVARCHAR(500),
        category NVARCHAR(50),
        rating INT DEFAULT 0,
        status INT DEFAULT 1,
        remark NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 物料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('materials') AND type in (N'U'))
BEGIN
    CREATE TABLE materials (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(200) NOT NULL,
        category NVARCHAR(100),
        unit NVARCHAR(20),
        specification NVARCHAR(500),
        supplier_id INT,
        price DECIMAL(18,2) DEFAULT 0,
        stock_quantity DECIMAL(18,4) DEFAULT 0,
        min_order_quantity DECIMAL(18,4) DEFAULT 0,
        status INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
END
GO

-- 采购合同表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('purchase_contracts') AND type in (N'U'))
BEGIN
    CREATE TABLE purchase_contracts (
        id INT PRIMARY KEY IDENTITY(1,1),
        contract_no NVARCHAR(50) UNIQUE NOT NULL,
        title NVARCHAR(200),
        supplier_id INT,
        contract_amount DECIMAL(18,2) DEFAULT 0,
        sign_date DATE,
        start_date DATE,
        end_date DATE,
        status NVARCHAR(20) DEFAULT 'draft',
        payment_terms NVARCHAR(500),
        delivery_terms NVARCHAR(500),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- 采购合同明细表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('purchase_contract_items') AND type in (N'U'))
BEGIN
    CREATE TABLE purchase_contract_items (
        id INT PRIMARY KEY IDENTITY(1,1),
        contract_id INT NOT NULL,
        material_id INT,
        quantity DECIMAL(18,4) NOT NULL,
        unit_price DECIMAL(18,2) NOT NULL,
        total_amount DECIMAL(18,2) NOT NULL,
        delivery_date DATE,
        FOREIGN KEY (contract_id) REFERENCES purchase_contracts(id),
        FOREIGN KEY (material_id) REFERENCES materials(id)
    );
END
GO

-- 采购订单表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('purchase_orders') AND type in (N'U'))
BEGIN
    CREATE TABLE purchase_orders (
        id INT PRIMARY KEY IDENTITY(1,1),
        order_no NVARCHAR(50) UNIQUE NOT NULL,
        supplier_id INT,
        total_amount DECIMAL(18,2) DEFAULT 0,
        order_date DATE,
        expected_date DATE,
        status NVARCHAR(20) DEFAULT 'draft',
        remark NVARCHAR(1000),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 3. 销售管理模块
-- =====================================================

-- 客户表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('customers') AND type in (N'U'))
BEGIN
    CREATE TABLE customers (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(50) UNIQUE,
        name NVARCHAR(200) NOT NULL,
        short_name NVARCHAR(100),
        customer_type NVARCHAR(20) DEFAULT 'potential',
        source NVARCHAR(50),
        industry NVARCHAR(100),
        level NVARCHAR(20) DEFAULT 'normal',
        status NVARCHAR(20) DEFAULT 'active',
        credit_rating NVARCHAR(10),
        payment_terms NVARCHAR(50),
        contact_person NVARCHAR(100),
        contact_phone NVARCHAR(20),
        contact_email NVARCHAR(100),
        contact_position NVARCHAR(50),
        address NVARCHAR(500),
        website NVARCHAR(100),
        bank NVARCHAR(100),
        bank_account NVARCHAR(50),
        tax_id NVARCHAR(50),
        annual_revenue DECIMAL(18,2),
        employee_count INT,
        main_product NVARCHAR(200),
        sales_id INT NULL,
        assigned_date DATE,
        lost_reason NVARCHAR(500),
        remarks NVARCHAR(MAX),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        last_contact_date DATETIME,
        FOREIGN KEY (sales_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE INDEX IX_customers_sales_id ON customers(sales_id);
    CREATE INDEX IX_customers_status ON customers(status);
    CREATE INDEX IX_customers_level ON customers(level);
    CREATE INDEX IX_customers_code ON customers(code);
    CREATE INDEX IX_customers_name ON customers(name);
    CREATE INDEX IX_customers_customer_type ON customers(customer_type);
END
GO

-- 客户联系人表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('customer_contacts') AND type in (N'U'))
BEGIN
    CREATE TABLE customer_contacts (
        id INT PRIMARY KEY IDENTITY(1,1),
        customer_id INT NOT NULL,
        name NVARCHAR(100) NOT NULL,
        position NVARCHAR(50),
        phone NVARCHAR(20),
        mobile NVARCHAR(20),
        email NVARCHAR(100),
        is_primary BIT DEFAULT 0,
        birthday DATETIME,
        hobbies NVARCHAR(200),
        remarks NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_customer_contacts_customer_id ON customer_contacts(customer_id);
END
GO

-- 客户跟进记录表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('customer_activities') AND type in (N'U'))
BEGIN
    CREATE TABLE customer_activities (
        id INT PRIMARY KEY IDENTITY(1,1),
        customer_id INT NOT NULL,
        activity_type NVARCHAR(50) NOT NULL,
        subject NVARCHAR(200),
        content NVARCHAR(MAX),
        next_plan_date DATE,
        next_plan_content NVARCHAR(500),
        attachments NVARCHAR(1000),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE INDEX IX_customer_activities_customer_id ON customer_activities(customer_id);
    CREATE INDEX IX_customer_activities_activity_type ON customer_activities(activity_type);
    CREATE INDEX IX_customer_activities_created_at ON customer_activities(created_at);
END
GO

-- 客户文档表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('customer_documents') AND type in (N'U'))
BEGIN
    CREATE TABLE customer_documents (
        id INT PRIMARY KEY IDENTITY(1,1),
        customer_id INT NOT NULL,
        document_type NVARCHAR(50),
        document_name NVARCHAR(200) NOT NULL,
        file_path NVARCHAR(500),
        file_size BIGINT,
        file_type NVARCHAR(50),
        uploaded_by INT,
        uploaded_at DATETIME DEFAULT GETDATE(),
        expiry_date DATE,
        remarks NVARCHAR(500),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
    CREATE INDEX IX_customer_documents_customer_id ON customer_documents(customer_id);
END
GO

-- 销售合同表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sales_contracts') AND type in (N'U'))
BEGIN
    CREATE TABLE sales_contracts (
        id INT PRIMARY KEY IDENTITY(1,1),
        contract_no NVARCHAR(50) UNIQUE NOT NULL,
        title NVARCHAR(200),
        customer_id INT,
        contract_amount DECIMAL(18,2) DEFAULT 0,
        sign_date DATE,
        start_date DATE,
        end_date DATE,
        status NVARCHAR(20) DEFAULT 'draft',
        payment_terms NVARCHAR(500),
        delivery_terms NVARCHAR(500),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- 报价单表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('quotations') AND type in (N'U'))
BEGIN
    CREATE TABLE quotations (
        id INT PRIMARY KEY IDENTITY(1,1),
        quotation_no NVARCHAR(50) UNIQUE NOT NULL,
        customer_id INT,
        total_amount DECIMAL(18,2) DEFAULT 0,
        valid_until DATE,
        status NVARCHAR(20) DEFAULT 'draft',
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 4. 仓库管理模块
-- =====================================================

-- 仓库表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('warehouses') AND type in (N'U'))
BEGIN
    CREATE TABLE warehouses (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) UNIQUE,
        location NVARCHAR(200),
        manager_id INT,
        capacity DECIMAL(18,4) DEFAULT 0,
        status INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (manager_id) REFERENCES users(id)
    );
END
GO

-- 库存表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('inventory') AND type in (N'U'))
BEGIN
    CREATE TABLE inventory (
        id INT PRIMARY KEY IDENTITY(1,1),
        warehouse_id INT,
        material_id INT,
        quantity DECIMAL(18,4) DEFAULT 0,
        reserved_quantity DECIMAL(18,4) DEFAULT 0,
        available_quantity DECIMAL(18,4) DEFAULT 0,
        last_in_date DATE,
        last_out_date DATE,
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (material_id) REFERENCES materials(id)
    );
END
GO

-- 库存出入库记录表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('inventory_transactions') AND type in (N'U'))
BEGIN
    CREATE TABLE inventory_transactions (
        id INT PRIMARY KEY IDENTITY(1,1),
        transaction_no NVARCHAR(50) UNIQUE NOT NULL,
        type NVARCHAR(20) NOT NULL,
        warehouse_id INT,
        material_id INT,
        quantity DECIMAL(18,4) NOT NULL,
        related_order_no NVARCHAR(50),
        remark NVARCHAR(500),
        operator_id INT,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (material_id) REFERENCES materials(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 5. 项目管理模块
-- =====================================================

-- 项目表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('projects') AND type in (N'U'))
BEGIN
    CREATE TABLE projects (
        id INT PRIMARY KEY IDENTITY(1,1),
        project_no NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(200) NOT NULL,
        customer_id INT,
        contract_id INT,
        project_type NVARCHAR(50),
        status NVARCHAR(20) DEFAULT 'initiating',
        start_date DATE,
        end_date DATE,
        actual_end_date DATE,
        budget DECIMAL(18,2) DEFAULT 0,
        manager_id INT,
        description NVARCHAR(2000),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (contract_id) REFERENCES sales_contracts(id),
        FOREIGN KEY (manager_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- 项目阶段表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('project_phases') AND type in (N'U'))
BEGIN
    CREATE TABLE project_phases (
        id INT PRIMARY KEY IDENTITY(1,1),
        project_id INT NOT NULL,
        name NVARCHAR(100) NOT NULL,
        start_date DATE,
        end_date DATE,
        status NVARCHAR(20) DEFAULT 'pending',
        completion_rate DECIMAL(5,2) DEFAULT 0,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
END
GO

-- =====================================================
-- 6. 质量管理模块
-- =====================================================

-- 质量检查表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('quality_inspections') AND type in (N'U'))
BEGIN
    CREATE TABLE quality_inspections (
        id INT PRIMARY KEY IDENTITY(1,1),
        inspection_no NVARCHAR(50) UNIQUE NOT NULL,
        project_id INT,
        inspection_type NVARCHAR(50),
        inspection_date DATE,
        inspector_id INT,
        result NVARCHAR(20),
        description NVARCHAR(2000),
        attachment_paths NVARCHAR(1000),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (inspector_id) REFERENCES users(id)
    );
END
GO

-- 不合格品记录表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('quality_nonconformities') AND type in (N'U'))
BEGIN
    CREATE TABLE quality_nonconformities (
        id INT PRIMARY KEY IDENTITY(1,1),
        record_no NVARCHAR(50) UNIQUE NOT NULL,
        project_id INT,
        description NVARCHAR(2000),
        severity NVARCHAR(20),
        status NVARCHAR(20) DEFAULT 'open',
        handled_by INT,
        handled_date DATE,
        solution NVARCHAR(2000),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (handled_by) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 7. 技术管理模块
-- =====================================================

-- 物料清单(BOM)表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('boms') AND type in (N'U'))
BEGIN
    CREATE TABLE boms (
        id INT PRIMARY KEY IDENTITY(1,1),
        bom_no NVARCHAR(50) UNIQUE NOT NULL,
        product_name NVARCHAR(200) NOT NULL,
        version NVARCHAR(20),
        status NVARCHAR(20) DEFAULT 'draft',
        created_by INT,
        approved_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    );
END
GO

-- BOM明细表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('bom_items') AND type in (N'U'))
BEGIN
    CREATE TABLE bom_items (
        id INT PRIMARY KEY IDENTITY(1,1),
        bom_id INT NOT NULL,
        material_id INT,
        quantity DECIMAL(18,4) NOT NULL,
        unit NVARCHAR(20),
       loss_rate DECIMAL(5,2) DEFAULT 0,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (bom_id) REFERENCES boms(id),
        FOREIGN KEY (material_id) REFERENCES materials(id)
    );
END
GO

-- 领料单表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('picking_lists') AND type in (N'U'))
BEGIN
    CREATE TABLE picking_lists (
        id INT PRIMARY KEY IDENTITY(1,1),
        picking_no NVARCHAR(50) UNIQUE NOT NULL,
        project_id INT,
        warehouse_id INT,
        status NVARCHAR(20) DEFAULT 'draft',
        picker_id INT,
        pick_date DATE,
        remark NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (picker_id) REFERENCES users(id)
    );
END
GO

-- 技术协议表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('tech_agreements') AND type in (N'U'))
BEGIN
    CREATE TABLE tech_agreements (
        id INT PRIMARY KEY IDENTITY(1,1),
        agreement_no NVARCHAR(50) UNIQUE NOT NULL,
        project_id INT,
        title NVARCHAR(200),
        content NVARCHAR(MAX),
        status NVARCHAR(20) DEFAULT 'draft',
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 8. 文件管理模块
-- =====================================================

-- 文件表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('files') AND type in (N'U'))
BEGIN
    CREATE TABLE files (
        id INT PRIMARY KEY IDENTITY(1,1),
        file_no NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(200) NOT NULL,
        path NVARCHAR(500),
        size BIGINT,
        type NVARCHAR(50),
        category NVARCHAR(50),
        project_id INT,
        uploader_id INT,
        upload_time DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (uploader_id) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 9. 知识库模块
-- =====================================================

-- 知识表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('knowledge') AND type in (N'U'))
BEGIN
    CREATE TABLE knowledge (
        id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(200) NOT NULL,
        category NVARCHAR(50),
        author NVARCHAR(100),
        content NVARCHAR(MAX),
        view_count INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- 10. 系统设置模块
-- =====================================================

-- 流程定义表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('flows') AND type in (N'U'))
BEGIN
    CREATE TABLE flows (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) UNIQUE,
        description NVARCHAR(500),
        steps NVARCHAR(MAX),
        status INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 工时费率表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('rates') AND type in (N'U'))
BEGIN
    CREATE TABLE rates (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) UNIQUE,
        rate_type NVARCHAR(50),
        unit_price DECIMAL(18,2) DEFAULT 0,
        unit NVARCHAR(20),
        effective_date DATE,
        expiry_date DATE,
        status INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- 11. ERP对接模块
-- =====================================================

-- ERP同步日志表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('erp_sync_logs') AND type in (N'U'))
BEGIN
    CREATE TABLE erp_sync_logs (
        id INT PRIMARY KEY IDENTITY(1,1),
        sync_type NVARCHAR(50),
        entity_type NVARCHAR(50),
        entity_id INT,
        status NVARCHAR(20),
        message NVARCHAR(1000),
        synced_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- 12. 生产管理模块
-- =====================================================

-- 生产工单表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('production_orders') AND type in (N'U'))
BEGIN
    CREATE TABLE production_orders (
        id INT PRIMARY KEY IDENTITY(1,1),
        order_no NVARCHAR(50) UNIQUE NOT NULL,
        project_id INT,
        bom_id INT,
        quantity DECIMAL(18,4) NOT NULL,
        scheduled_start_date DATE,
        scheduled_end_date DATE,
        actual_start_date DATE,
        actual_end_date DATE,
        status NVARCHAR(20) DEFAULT 'planned',
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (bom_id) REFERENCES boms(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- =====================================================
-- 初始化基础数据
-- =====================================================

-- 插入部门数据
INSERT INTO departments (name, icon, color, manager, parent_id, sort_order) VALUES
('总经办', 'fa fa-user-tie', '#409eff', '总经理', NULL, 1),
('质量安全部', 'fa fa-shield', '#e74c3c', '质量安全经理', NULL, 2),
('供应链管理部', 'fa fa-link', '#3498db', '供应链经理', NULL, 3),
('人事行政部', 'fa fa-users', '#9b59b6', '人事行政经理', NULL, 4),
('财务&商务部', 'fa fa-calculator', '#f39c12', '财务&商务经理', NULL, 5),
('铸造事业部', 'fa fa-industry', '#795548', '事业部总监', NULL, 6),
('光伏半导体事业部', 'fa fa-sun-o', '#ff9800', '事业部总监', NULL, 7),
('产品研发部', 'fa fa-flask', '#00bcd4', '产品研发经理', NULL, 8),
('电池事业部', 'fa fa-battery-full', '#4caf50', '事业部总监', NULL, 9),
('市场&海外营销部', 'fa fa-globe', '#e91e63', '市场&海外营销经理', NULL, 10),
('工程部', 'fa fa-cogs', '#607d8b', '工程总监', NULL, 11),
('项目部', 'fa fa-tasks', '#3f51b5', '项目部经理', NULL, 12);
GO

-- 插入用户数据 (密码为 admin123 的MD5值，实际使用时请加密)
INSERT INTO users (username, password, name, role, department_id, position, phone, email) VALUES
-- 总经办
('admin', 'admin123', '管理员', 'admin', 1, '总经理', '13800138001', 'admin@manfred.com'),
('techadvisor', 'admin123', '技术顾问', 'supervisor', 1, '技术顾问', '13800138002', 'techadvisor@manfred.com'),
-- 质量安全部
('liquan', 'admin123', '李全', 'supervisor', 2, '质量安全经理', '13800138003', 'liquan@manfred.com'),
('zhangmingming', 'admin123', '张明明', 'employee', 2, '质量安全专员', '13800138004', 'zhangmingming@manfred.com'),
('wangquanlin', 'admin123', '王全林', 'employee', 2, '质量工程师', '13800138005', 'wangquanlin@manfred.com'),
('runjiajia', 'admin123', '润佳佳', 'employee', 2, '安全工程师', '13800138006', 'runjiajia@manfred.com'),
-- 供应链管理部 - 仓库部
('zhangyinglong', 'admin123', '张应龙', 'supervisor', 3, '仓库经理', '13800138007', 'zhangyinglong@manfred.com'),
('zhangjie', 'admin123', '张杰', 'employee', 3, '仓管员', '13800138008', 'zhangjie@manfred.com'),
('zhaochengcheng', 'admin123', '赵成成', 'employee', 3, '仓管员', '13800138009', 'zhaochengcheng@manfred.com'),
('lichao', 'admin123', '李超', 'employee', 3, '仓管员', '13800138010', 'lichao@manfred.com'),
('mashaona', 'admin123', '马少娜', 'employee', 3, '实习生', '13800138011', 'mashaona@manfred.com'),
-- 供应链管理部 - 采购&物流部
('kongzijuan', 'admin123', '孔子娟', 'supervisor', 3, '供应链经理', '13800138012', 'kongzijuan@manfred.com'),
('sunxiuli', 'admin123', '孙秀丽', 'employee', 3, '采购工程师', '13800138013', 'sunxiuli@manfred.com'),
('xumeizhu', 'admin123', '徐美珠', 'employee', 3, '采购工程师', '13800138014', 'xumeizhu@manfred.com'),
('wangxinxiao', 'admin123', '王馨肖', 'employee', 3, '采购工程师', '13800138015', 'wangxinxiao@manfred.com'),
('zhangyingmin', 'admin123', '张营敏', 'employee', 3, '采购工程师', '13800138016', 'zhangyingmin@manfred.com'),
('yuanmingjie', 'admin123', '袁明杰', 'employee', 3, '物流专员', '13800138017', 'yuanmingjie@manfred.com'),
-- 人事行政部
('zhoumeifang', 'admin123', '周美芳', 'supervisor', 4, '人事行政经理', '13800138018', 'zhoumeifang@manfred.com'),
('yuyue', 'admin123', '岳雨', 'employee', 4, '人事专员', '13800138019', 'yuyue@manfred.com'),
-- 财务&商务部
('chenyunming', 'admin123', '陈云明', 'supervisor', 5, '财务&商务经理', '13800138020', 'chenyunming@manfred.com'),
('zhulin', 'admin123', '朱琳', 'supervisor', 5, '财务经理', '13800138021', 'zhulin@manfred.com'),
('huangan', 'admin123', '黄楠', 'employee', 5, '出纳', '13800138022', 'huangan@manfred.com'),
('zhouqi', 'admin123', '周琦', 'employee', 5, '往来会计', '13800138023', 'zhouqi@manfred.com'),
('youjianfeng', 'admin123', '游剑峰', 'supervisor', 5, '信息技术工程师', '13800138024', 'youjianfeng@manfred.com'),
('huchenyu', 'admin123', '胡晨宇', 'employee', 5, '会计', '13800138025', 'huchenyu@manfred.com'),
-- 项目部
('bizhaowei', 'admin123', '毕照卫', 'supervisor', 12, '项目部经理', '13800138026', 'bizhaowei@manfred.com'),
('qiweilong', 'admin123', '邱维龙', 'employee', 12, '项目经理', '13800138027', 'qiweilong@manfred.com'),
('yuchen', 'admin123', '余臣', 'employee', 12, '项目经理', '13800138028', 'yuchen@manfred.com'),
('wangbingbing', 'admin123', '王冰冰', 'employee', 12, '项目经理', '13800138029', 'wangbingbing@manfred.com'),
('liupei', 'admin123', '刘培', 'employee', 12, '项目经理', '13800138030', 'liupei@manfred.com'),
('zhukai', 'admin123', '朱凯', 'employee', 12, '项目经理', '13800138031', 'zhukai@manfred.com'),
('lvkerun', 'admin123', '吕科润', 'employee', 12, '项目经理', '13800138032', 'lvkerun@manfred.com'),
('zhouqiang', 'admin123', '周强', 'employee', 12, '项目经理', '13800138033', 'zhouqiang@manfred.com'),
-- 市场&海外营销部
('fangwen', 'admin123', '方雯', 'supervisor', 10, '市场&海外营销经理', '13800138034', 'fangwen@manfred.com'),
('fengliping', 'admin123', '冯丽萍', 'supervisor', 10, '市场&海外营销部主管', '13800138035', 'fengliping@manfred.com'),
('shuxinrun', 'admin123', '束欣润', 'employee', 10, '市场专员', '13800138036', 'shuxinrun@manfred.com'),
('jiran', 'admin123', '纪冉', 'employee', 10, '市场专员', '13800138037', 'jiran@manfred.com'),
-- 产品研发部
('tangfeng', 'admin123', '唐峰', 'supervisor', 8, '产品研发经理', '13800138038', 'tangfeng@manfred.com'),
('chenxiaoming', 'admin123', '陈小明', 'employee', 8, '高级编程工程师', '13800138039', 'chenxiaoming@manfred.com'),
('yanjiangjiang', 'admin123', '言江江', 'supervisor', 8, '软件开发主管', '13800138040', 'yanjiangjiang@manfred.com'),
('shenyang', 'admin123', '沈阳', 'employee', 8, '视觉工程师', '13800138041', 'shenyang@manfred.com'),
('liangyuanning', 'admin123', '梁远宁', 'employee', 8, '视觉工程师', '13800138042', 'liangyuanning@manfred.com'),
('lihao', 'admin123', '李浩', 'supervisor', 8, '电气经理', '13800138043', 'lihao@manfred.com'),
('yangjinxin', 'admin123', '杨金鑫', 'employee', 8, '视觉工程师', '13800138044', 'yangjinxin@manfred.com');
GO

PRINT 'M-A_OP_ODB 数据库初始化完成！';
