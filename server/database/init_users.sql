-- 创建用户表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_users')
BEGIN
    CREATE TABLE sys_users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) DEFAULT 'employee',
        department_id INT,
        position NVARCHAR(100),
        phone NVARCHAR(20),
        email NVARCHAR(100),
        avatar NVARCHAR(255),
        status NVARCHAR(20) DEFAULT 'active',
        permissions NVARCHAR(MAX),
        data_permission NVARCHAR(MAX),
        last_login DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        FOREIGN KEY (department_id) REFERENCES sys_departments(id)
    );
    
    -- 创建索引
    CREATE INDEX idx_user_dept ON sys_users(department_id);
    CREATE INDEX idx_user_status ON sys_users(status);
    CREATE INDEX idx_user_username ON sys_users(username);
    
    PRINT '用户表创建成功';
END
ELSE
BEGIN
    PRINT '用户表已存在';
END

-- 插入示例用户数据（根据列表视图）
IF NOT EXISTS (SELECT 1 FROM sys_users WHERE username = 'zhengfh')
BEGIN
    SET IDENTITY_INSERT sys_users ON;
    
    -- 总经办用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (1, 'zhengfh', '$2b$10$YourHashedPasswordHere', '郑风华', 'admin', 1, '总经理', '13800138001', 'zhengfh@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (2, 'tech_advisor', '$2b$10$YourHashedPasswordHere', '技术顾问', 'dept_manager', 1, '技术顾问', '13800138002', 'advisor@manfred.com', 'active');
    
    -- 质量安全部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (3, 'wangxl', '$2b$10$YourHashedPasswordHere', '王旭良', 'dept_manager', 2, '质量经理', '13800138003', 'wangxl@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (4, 'wangtao', '$2b$10$YourHashedPasswordHere', '王涛', 'employee', 2, '质量工程师', '13800138004', 'wangtao@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (5, 'zhangsan', '$2b$10$YourHashedPasswordHere', '张三', 'employee', 2, '安全员', '13800138005', 'zhangsan@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (6, 'lishi', '$2b$10$YourHashedPasswordHere', '李四', 'employee', 2, '质量工程师', '13800138006', 'lishi@manfred.com', 'active');
    
    -- 供应链管理部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (7, 'liumou', '$2b$10$YourHashedPasswordHere', '刘某', 'dept_manager', 3, '供应链经理', '13800138007', 'liumou@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (8, 'zhumou', '$2b$10$YourHashedPasswordHere', '朱某', 'employee', 3, '采购专员', '13800138008', 'zhumou@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (9, 'moumou', '$2b$10$YourHashedPasswordHere', '某某', 'employee', 3, '物流专员', '13800138009', 'moumou@manfred.com', 'active');
    
    -- 人事行政部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (10, 'renshi_mgr', '$2b$10$YourHashedPasswordHere', '人事经理', 'dept_manager', 4, '人事经理', '13800138010', 'renshi@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (11, 'xingzheng', '$2b$10$YourHashedPasswordHere', '行政专员', 'employee', 4, '行政专员', '13800138011', 'xingzheng@manfred.com', 'active');
    
    -- 财务&商务部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (12, 'caiwu_mgr', '$2b$10$YourHashedPasswordHere', '财务经理', 'dept_manager', 5, '财务经理', '13800138012', 'caiwu@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (13, 'kuaiji', '$2b$10$YourHashedPasswordHere', '会计', 'employee', 5, '会计', '13800138013', 'kuaiji@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (14, 'shangwu', '$2b$10$YourHashedPasswordHere', '商务专员', 'employee', 5, '商务专员', '13800138014', 'shangwu@manfred.com', 'active');
    
    -- 铸造事业部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (15, 'zhuzao_mgr', '$2b$10$YourHashedPasswordHere', '事业部经理', 'dept_manager', 6, '事业部经理', '13800138015', 'zhuzao@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (16, 'zhuzao_eng1', '$2b$10$YourHashedPasswordHere', '铸造工程师 1', 'employee', 6, '铸造工程师', '13800138016', 'zhuzao1@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (17, 'zhuzao_eng2', '$2b$10$YourHashedPasswordHere', '铸造工程师 2', 'employee', 6, '铸造工程师', '13800138017', 'zhuzao2@manfred.com', 'active');
    
    -- 光伏半导体事业部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (18, 'gf_mgr', '$2b$10$YourHashedPasswordHere', '事业部经理', 'dept_manager', 7, '事业部经理', '13800138018', 'gf@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (19, 'gf_gongyi', '$2b$10$YourHashedPasswordHere', '工艺工程师', 'employee', 7, '工艺工程师', '13800138019', 'gf_gongyi@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (20, 'gf_shebei', '$2b$10$YourHashedPasswordHere', '设备工程师', 'employee', 7, '设备工程师', '13800138020', 'gf_shebei@manfred.com', 'active');
    
    -- 产品研发部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (21, 'yd_mgr', '$2b$10$YourHashedPasswordHere', '研发经理', 'dept_manager', 8, '研发经理', '13800138021', 'yd@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (22, 'yd_jiegou', '$2b$10$YourHashedPasswordHere', '结构工程师', 'employee', 8, '结构工程师', '13800138022', 'yd_jiegou@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (23, 'yd_dianqi', '$2b$10$YourHashedPasswordHere', '电气工程师', 'employee', 8, '电气工程师', '13800138023', 'yd_dianqi@manfred.com', 'active');
    
    -- 电池事业部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (24, 'dc_mgr', '$2b$10$YourHashedPasswordHere', '事业部经理', 'dept_manager', 9, '事业部经理', '13800138024', 'dc@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (25, 'dc_eng', '$2b$10$YourHashedPasswordHere', '电池工程师', 'employee', 9, '电池工程师', '13800138025', 'dc_eng@manfred.com', 'active');
    
    -- 市场&海外营销部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (26, 'sc_mgr', '$2b$10$YourHashedPasswordHere', '市场经理', 'dept_manager', 10, '市场经理', '13800138026', 'sc@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (27, 'hw_sale', '$2b$10$YourHashedPasswordHere', '海外销售经理', 'employee', 10, '海外销售经理', '13800138027', 'hw_sale@manfred.com', 'active');
    
    -- 工程部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (28, 'gd_mgr', '$2b$10$YourHashedPasswordHere', '工程经理', 'dept_manager', 11, '工程经理', '13800138028', 'gd@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (29, 'gd_jixie', '$2b$10$YourHashedPasswordHere', '机械工程师', 'employee', 11, '机械工程师', '13800138029', 'gd_jixie@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (30, 'gd_dianqi', '$2b$10$YourHashedPasswordHere', '电气工程师', 'employee', 11, '电气工程师', '13800138030', 'gd_dianqi@manfred.com', 'active');
    
    -- 项目部用户
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (31, 'xm_mgr', '$2b$10$YourHashedPasswordHere', '项目经理', 'dept_manager', 12, '项目经理', '13800138031', 'xm@manfred.com', 'active');
    
    INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status)
    VALUES (32, 'xm_zhuli', '$2b$10$YourHashedPasswordHere', '项目助理', 'employee', 12, '项目助理', '13800138032', 'xm_zhuli@manfred.com', 'active');
    
    SET IDENTITY_INSERT sys_users OFF;
    
    PRINT '示例用户数据插入成功';
END
ELSE
BEGIN
    PRINT '用户数据已存在，跳过初始化';
END
GO
