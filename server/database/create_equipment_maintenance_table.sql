-- 客户设备台账表
-- 用于记录客户设备信息，关联售后维保

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_equipment' AND xtype='U')
BEGIN
    CREATE TABLE customer_equipment (
        id INT IDENTITY(1,1) PRIMARY KEY,
        equipment_code NVARCHAR(100) NOT NULL,
        equipment_name NVARCHAR(200) NOT NULL,
        customer_id INT NOT NULL,
        equipment_model NVARCHAR(200),
        equipment_specs NVARCHAR(500),
        serial_number NVARCHAR(200),
        manufacture_date DATE,
        installation_date DATE,
        warranty_expire_date DATE,
        equipment_status NVARCHAR(50) DEFAULT 'normal',  -- normal/running/maintenance/broken/scraped
        equipment_location NVARCHAR(500),
        production_line NVARCHAR(200),
        photo_urls NVARCHAR(MAX),
        remarks NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,

        CONSTRAINT FK_equipment_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX idx_equipment_customer ON customer_equipment(customer_id);
    CREATE INDEX idx_equipment_code ON customer_equipment(equipment_code);
    CREATE INDEX idx_equipment_status ON customer_equipment(equipment_status);

    PRINT 'customer_equipment表创建成功';
END
ELSE
BEGIN
    PRINT 'customer_equipment表已存在';
END
GO

-- 设备维保记录表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='equipment_maintenance_records' AND xtype='U')
BEGIN
    CREATE TABLE equipment_maintenance_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        equipment_id INT NOT NULL,
        maintenance_type NVARCHAR(50) NOT NULL,  -- repair/inspection/maintenance/parts
        maintenance_date DATETIME NOT NULL,
        engineer_id INT,
        maintenance_content NVARCHAR(MAX),
        parts_replaced NVARCHAR(MAX),
        maintenance_hours DECIMAL(10,2),
        cost DECIMAL(18,2),
        next_maintenance_date DATE,
        customer_feedback NVARCHAR(500),
        report_urls NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        created_by INT,

        CONSTRAINT FK_maintenance_equipment FOREIGN KEY (equipment_id) REFERENCES customer_equipment(id),
        CONSTRAINT FK_maintenance_engineer FOREIGN KEY (engineer_id) REFERENCES sys_users(id)
    );

    CREATE INDEX idx_maintenance_equipment ON equipment_maintenance_records(equipment_id);
    CREATE INDEX idx_maintenance_date ON equipment_maintenance_records(maintenance_date);

    PRINT 'equipment_maintenance_records表创建成功';
END
ELSE
BEGIN
    PRINT 'equipment_maintenance_records表已存在';
END
GO

-- 设备报修记录表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='equipment_repair_requests' AND xtype='U')
BEGIN
    CREATE TABLE equipment_repair_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        equipment_id INT NOT NULL,
        request_no NVARCHAR(50) NOT NULL,
        reporter_name NVARCHAR(100),
        reporter_phone NVARCHAR(50),
        fault_description NVARCHAR(MAX),
        faultPhotos NVARCHAR(MAX),
        request_date DATETIME DEFAULT GETDATE(),
        priority NVARCHAR(50) DEFAULT 'normal',  -- urgent/important/normal/low
        status NVARCHAR(50) DEFAULT 'pending',  -- pending/assigned/processing/completed/cancelled
        assigned_engineer_id INT,
        assigned_date DATETIME,
        completed_date DATETIME,
        evaluation NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_repair_equipment FOREIGN KEY (equipment_id) REFERENCES customer_equipment(id)
    );

    CREATE INDEX idx_repair_equipment ON equipment_repair_requests(equipment_id);
    CREATE INDEX idx_repair_status ON equipment_repair_requests(status);
    CREATE INDEX idx_repair_request_no ON equipment_repair_requests(request_no);

    PRINT 'equipment_repair_requests表创建成功';
END
ELSE
BEGIN
    PRINT 'equipment_repair_requests表已存在';
END
GO

-- 维保计划表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='maintenance_plans' AND xtype='U')
BEGIN
    CREATE TABLE maintenance_plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        equipment_id INT NOT NULL,
        plan_no NVARCHAR(50) NOT NULL,
        plan_type NVARCHAR(50),  -- daily/weekly/monthly/quarterly/yearly
        plan_content NVARCHAR(MAX),
        plan_date DATE,
        engineer_id INT,
        status NVARCHAR(50) DEFAULT 'pending',  -- pending/completed/cancelled
        completed_date DATETIME,
        remarks NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_plan_equipment FOREIGN KEY (equipment_id) REFERENCES customer_equipment(id)
    );

    CREATE INDEX idx_plan_equipment ON maintenance_plans(equipment_id);
    CREATE INDEX idx_plan_status ON maintenance_plans(status);
    CREATE INDEX idx_plan_date ON maintenance_plans(plan_date);

    PRINT 'maintenance_plans表创建成功';
END
ELSE
BEGIN
    PRINT 'maintenance_plans表已存在';
END
GO
