-- ========================================
-- 创建小组管理表
-- 支持部门内的小组管理
-- 创建时间：2026-03-31
-- ========================================

PRINT '=== 开始创建小组管理表 ===';
PRINT '';

-- ========================================
-- 1. 创建 sys_teams 表
-- ========================================
PRINT '创建 sys_teams 表...';

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_teams]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sys_teams] (
        [id] INT IDENTITY(1,1) NOT NULL,                    -- 主键
        [team_code] NVARCHAR(50) NOT NULL,                  -- 小组编码
        [name] NVARCHAR(100) NOT NULL,                      -- 小组名称
        [department_id] INT NOT NULL,                       -- 所属部门ID
        [leader_id] INT NULL,                                -- 组长ID（关联用户）
        [headcount] INT DEFAULT 0,                           -- 编制人数
        [current_staff] INT DEFAULT 0,                       -- 当前人数
        [description] NVARCHAR(500) NULL,                    -- 小组描述
        [status] NVARCHAR(20) DEFAULT 'active',              -- 状态：active/inactive
        [sort_order] INT DEFAULT 0,                         -- 排序
        [created_by] INT NULL,                               -- 创建人
        [created_at] DATETIME DEFAULT GETDATE(),            -- 创建时间
        [updated_by] INT NULL,                              -- 更新人
        [updated_at] DATETIME DEFAULT GETDATE(),             -- 更新时间
        CONSTRAINT [PK_sys_teams] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_sys_teams_code] UNIQUE NONCLUSTERED ([team_code] ASC)
    );

    PRINT '✅ sys_teams 表创建成功';
END
ELSE
BEGIN
    PRINT '⚠️ sys_teams 表已存在';
END
PRINT '';

-- ========================================
-- 2. 创建 sys_users 的 team_id 字段
-- ========================================
PRINT '添加 sys_users.team_id 字段...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[sys_users]') AND name = 'team_id')
BEGIN
    ALTER TABLE [dbo].[sys_users]
    ADD [team_id] INT NULL;

    -- 添加外键约束
    ALTER TABLE [dbo].[sys_users]
    ADD CONSTRAINT [FK_sys_users_team]
    FOREIGN KEY ([team_id])
    REFERENCES [dbo].[sys_teams] ([id])
    ON SET NULL ON UPDATE CASCADE;

    PRINT '✅ team_id 字段添加成功';
END
ELSE
BEGIN
    PRINT '⚠️ team_id 字段已存在';
END
PRINT '';

-- ========================================
-- 3. 创建测试小组数据
-- ========================================
PRINT '创建测试小组数据...';

SET IDENTITY_INSERT [dbo].[sys_teams] ON;

-- 采购部的采购一组和采购二组
IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_001')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (1, 'TEAM_001', '采购一组', 3, 5, 2, '负责原材料采购', 'active', 1);
END

IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_002')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (2, 'TEAM_002', '采购二组', 3, 5, 2, '负责设备采购', 'active', 2);
END

-- 研发部的开发一组和开发二组
IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_003')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (3, 'TEAM_003', '开发一组', 7, 10, 5, '负责单机研发', 'active', 1);
END

IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_004')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (4, 'TEAM_004', '开发二组', 7, 10, 3, '负责自动化研发', 'active', 2);
END

-- 工程部的机械组和电气组
IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_005')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (5, 'TEAM_005', '机械组', 11, 20, 15, '负责机械设计', 'active', 1);
END

IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_006')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (6, 'TEAM_006', '电气组', 11, 15, 10, '负责电气设计', 'active', 2);
END

SET IDENTITY_INSERT [dbo].[sys_teams] OFF;

PRINT '✅ 测试小组数据创建成功';
PRINT '';

-- ========================================
-- 4. 创建更新小组人数的存储过程
-- ========================================
PRINT '创建更新小组人数的存储过程...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateTeamHeadcount]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[sp_UpdateTeamHeadcount];
GO

CREATE PROCEDURE [dbo].[sp_UpdateTeamHeadcount]
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE t
    SET t.current_staff = (
        SELECT COUNT(*)
        FROM sys_users u
        WHERE u.team_id = t.id AND u.status = 'active'
    )
    FROM sys_teams t;
END
GO

PRINT '✅ 存储过程创建成功';
PRINT '';

-- ========================================
-- 5. 执行存储过程更新人数
-- ========================================
PRINT '更新小组人数...';
EXEC [dbo].[sp_UpdateTeamHeadcount];
PRINT '✅ 小组人数更新完成';
PRINT '';

-- ========================================
-- 6. 创建视图：获取完整的组织架构（包含小组）
-- ========================================
PRINT '创建组织架构视图...';

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[v_OrganizationTree]'))
    DROP VIEW [dbo].[v_OrganizationTree];
GO

CREATE VIEW [dbo].[v_OrganizationTree]
AS
SELECT
    d.id AS dept_id,
    d.name AS dept_name,
    d.department_code,
    d.parent_id AS dept_parent_id,
    d.level AS dept_level,
    NULL AS team_id,
    NULL AS team_name,
    NULL AS team_code,
    'department' AS node_type
FROM sys_departments d
WHERE d.status = 'active'

UNION ALL

SELECT
    d.id AS dept_id,
    d.name AS dept_name,
    d.department_code,
    d.parent_id AS dept_parent_id,
    d.level AS dept_level,
    t.id AS team_id,
    t.name AS team_name,
    t.team_code,
    'team' AS node_type
FROM sys_departments d
INNER JOIN sys_teams t ON d.id = t.department_id
WHERE d.status = 'active' AND t.status = 'active'

UNION ALL

SELECT
    d.id AS dept_id,
    d.name AS dept_name,
    d.department_code,
    d.parent_id AS dept_parent_id,
    d.level AS dept_level,
    t.id AS team_id,
    t.name AS team_name,
    t.team_code,
    'team_with_leader' AS node_type
FROM sys_departments d
INNER JOIN sys_teams t ON d.id = t.department_id
WHERE d.status = 'active' AND t.status = 'active' AND t.leader_id IS NOT NULL;
GO

PRINT '✅ 组织架构视图创建成功';
PRINT '';

-- ========================================
-- 7. 创建视图：用户完整信息（包含小组）
-- ========================================
PRINT '创建用户完整信息视图...';

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[v_UsersComplete]'))
    DROP VIEW [dbo].[v_UsersComplete];
GO

CREATE VIEW [dbo].[v_UsersComplete]
AS
SELECT
    u.id,
    u.username,
    u.name,
    u.email,
    u.phone,
    u.position,
    u.role,
    u.status,
    u.department_id,
    d.name AS department_name,
    d.department_code,
    u.team_id,
    t.name AS team_name,
    t.team_code,
    t.leader_id
FROM sys_users u
LEFT JOIN sys_departments d ON u.department_id = d.id
LEFT JOIN sys_teams t ON u.team_id = t.id;
GO

PRINT '✅ 用户完整信息视图创建成功';
PRINT '';

-- ========================================
-- 验证结果
-- ========================================
PRINT '';
PRINT '=== 验证结果 ===';
PRINT '';

PRINT '1. 小组列表：';
SELECT team_code AS 小组编码, name AS 小组名称, headcount AS 编制, current_staff AS 现员 FROM sys_teams;

PRINT '';
PRINT '2. 用户中的小组分配：';
SELECT username AS 工号, name AS 姓名, department_name AS 部门, team_name AS 小组
FROM v_UsersComplete
WHERE team_name IS NOT NULL;

PRINT '';
PRINT '✅ 小组管理表创建完成！';
