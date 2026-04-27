-- 创建小组管理表
-- 支持部门内的小组管理
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_teams]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sys_teams] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [team_code] NVARCHAR(50) NOT NULL,
        [name] NVARCHAR(100) NOT NULL,
        [department_id] INT NOT NULL,
        [parent_team_id] INT NULL,
        [leader_id] INT NULL,
        [headcount] INT DEFAULT 0,
        [current_staff] INT DEFAULT 0,
        [description] NVARCHAR(500) NULL,
        [status] NVARCHAR(20) DEFAULT 'active',
        [sort_order] INT DEFAULT 0,
        [created_by] INT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_by] INT NULL,
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [PK_sys_teams] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    ALTER TABLE [dbo].[sys_teams] ADD CONSTRAINT [FK_sys_teams_parent_team] FOREIGN KEY ([parent_team_id]) REFERENCES [dbo].[sys_teams] ([id]) ON SET NULL ON UPDATE CASCADE;

    PRINT 'sys_teams table created successfully';
END
ELSE
BEGIN
    PRINT 'sys_teams table already exists';
END

-- Add team_id to sys_users if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[sys_users]') AND name = 'team_id')
BEGIN
    ALTER TABLE [dbo].[sys_users] ADD [team_id] INT NULL;
    ALTER TABLE [dbo].[sys_users] ADD CONSTRAINT [FK_sys_users_team] FOREIGN KEY ([team_id]) REFERENCES [dbo].[sys_teams] ([id]) ON SET NULL ON UPDATE CASCADE;
    PRINT 'team_id field added to sys_users';
END

-- Insert test data
SET IDENTITY_INSERT [dbo].[sys_teams] ON;

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

IF NOT EXISTS (SELECT * FROM sys_teams WHERE team_code = 'TEAM_003')
BEGIN
    INSERT INTO [dbo].[sys_teams] ([id], [team_code], [name], [department_id], [headcount], [current_staff], [description], [status], [sort_order])
    VALUES (3, 'TEAM_003', '开发一组', 7, 10, 5, '负责单机研发', 'active', 1);
END

SET IDENTITY_INSERT [dbo].[sys_teams] OFF;

PRINT 'Test data inserted';
