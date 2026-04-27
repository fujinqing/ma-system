-- 创建部门表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_departments')
BEGIN
    CREATE TABLE sys_departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        manager NVARCHAR(100),
        headcount INT DEFAULT 0,
        current_staff INT DEFAULT 0,
        icon NVARCHAR(50) DEFAULT 'fa fa-building',
        color NVARCHAR(20) DEFAULT '#165DFF',
        parent_id INT NULL,
        level INT DEFAULT 1,
        sort_order INT DEFAULT 0,
        positions NVARCHAR(MAX),
        description NVARCHAR(500),
        status NVARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        FOREIGN KEY (parent_id) REFERENCES sys_departments(id)
    );
    
    -- 创建索引
    CREATE INDEX idx_dept_parent ON sys_departments(parent_id);
    CREATE INDEX idx_dept_status ON sys_departments(status);
    
    PRINT '部门表创建成功';
END
ELSE
BEGIN
    PRINT '部门表已存在';
END

-- 插入初始部门数据（根据组织架构图）
IF NOT EXISTS (SELECT 1 FROM sys_departments WHERE department_code = 'DEPT_001')
BEGIN
    SET IDENTITY_INSERT sys_departments ON;
    
    -- 总经办
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (1, 'DEPT_001', '总经办', '郑风华', 10, 2, 'fa fa-briefcase', '#D4380D', 1, 1, '总经理，技术顾问，总助', '公司最高管理层');
    
    -- 质量安全部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (2, 'DEPT_002', '质量安全部', '', 10, 4, 'fa fa-check-circle', '#389E0D', 1, 2, '质量经理，质量工程师，安全员', '负责质量管理和安全生产');
    
    -- 供应链管理部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (3, 'DEPT_003', '供应链管理部', '', 20, 12, 'fa fa-shipping-fast', '#13C2C2', 1, 3, '供应链经理，采购专员，物流专员', '负责采购和物流管理');
    
    -- 人事行政部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (4, 'DEPT_004', '人事行政部', '', 5, 2, 'fa fa-users', '#722ED1', 1, 4, '人事经理，行政专员，招聘专员', '负责人力资源和行政管理');
    
    -- 财务&商务部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (5, 'DEPT_005', '财务&商务部', '', 10, 6, 'fa fa-chart-line', '#FA8C16', 1, 5, '财务经理，会计，商务专员', '负责财务和商务管理');
    
    -- 铸造事业部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (6, 'DEPT_006', '铸造事业部', '', 50, 37, 'fa fa-industry', '#F5222D', 1, 6, '事业部经理，铸造工程师，技术员', '负责铸造业务');
    
    -- 光伏半导体事业部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (7, 'DEPT_007', '光伏半导体事业部', '', 30, 23, 'fa fa-solar-panel', '#1890FF', 1, 7, '事业部经理，工艺工程师，设备工程师', '负责光伏半导体业务');
    
    -- 产品研发部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (8, 'DEPT_008', '产品研发部', '', 15, 7, 'fa fa-flask', '#722ED1', 1, 8, '研发经理，结构工程师，电气工程师', '负责产品研发');
    
    -- 电池事业部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (9, 'DEPT_009', '电池事业部', '', 30, 22, 'fa fa-battery-full', '#52C41A', 1, 9, '事业部经理，电池工程师，测试工程师', '负责电池业务');
    
    -- 市场&海外营销部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (10, 'DEPT_010', '市场&海外营销部', '', 10, 4, 'fa fa-globe', '#13C2C2', 1, 10, '市场经理，海外销售经理，市场专员', '负责市场和海外营销');
    
    -- 工程部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (11, 'DEPT_011', '工程部', '', 80, 55, 'fa fa-tools', '#FAAD14', 1, 11, '工程经理，机械工程师，电气工程师，调试工程师', '负责工程实施');
    
    -- 项目部
    INSERT INTO sys_departments (id, department_code, name, manager, headcount, current_staff, icon, color, level, sort_order, positions, description)
    VALUES (12, 'DEPT_012', '项目部', '', 15, 8, 'fa fa-project-diagram', '#EB2F96', 1, 12, '项目经理，项目助理，项目专员', '负责项目管理');
    
    SET IDENTITY_INSERT sys_departments OFF;
    
    PRINT '初始部门数据插入成功';
END
ELSE
BEGIN
    PRINT '部门数据已存在，跳过初始化';
END
GO
