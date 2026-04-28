-- =====================================================
-- 系统角色表初始化脚本
-- =====================================================

USE M-A_OP_ODB;
GO

-- 1. 角色表
IF OBJECT_ID('dbo.sys_roles','U') IS NULL
CREATE TABLE dbo.sys_roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_code NVARCHAR(50) NOT NULL UNIQUE,
    role_name NVARCHAR(100) NOT NULL,
    role_desc NVARCHAR(500) NULL,
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    INDEX IX_role_code (role_code),
    INDEX IX_status (status)
);
GO

-- 2. 用户角色关联表
IF OBJECT_ID('dbo.sys_user_roles','U') IS NULL
CREATE TABLE dbo.sys_user_roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES dbo.sys_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES dbo.sys_roles(role_id) ON DELETE CASCADE,
    UNIQUE INDEX IX_user_role (user_id, role_id),
    INDEX IX_user_id (user_id),
    INDEX IX_role_id (role_id)
);
GO

-- 插入默认角色
IF NOT EXISTS (SELECT 1 FROM dbo.sys_roles WHERE role_code = 'admin')
BEGIN
    INSERT INTO dbo.sys_roles (role_code, role_name, role_desc, status)
    VALUES
        ('admin', '系统管理员', '拥有系统所有权限', 'active'),
        ('supervisor', '主管', '管理部门和下属员工', 'active'),
        ('manager', '经理', '管理特定业务模块', 'active'),
        ('employee', '普通员工', '基本操作权限', 'active'),
        ('finance', '财务', '财务相关权限', 'active'),
        ('hr', '人事', '人事管理权限', 'active'),
        ('warehouse', '仓库管理员', '仓库管理权限', 'active'),
        ('sales', '销售', '销售管理权限', 'active');
END
GO
