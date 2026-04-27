-- 确保 sys_users 表有 team_id 字段
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[sys_users]') AND name = 'team_id')
BEGIN
    ALTER TABLE [dbo].[sys_users] ADD [team_id] INT NULL;
    PRINT 'team_id 字段已添加到 sys_users 表';
END
ELSE
BEGIN
    PRINT 'team_id 字段已存在';
END

-- 确保外键约束存在
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_sys_users_team')
BEGIN
    ALTER TABLE [dbo].[sys_users] ADD CONSTRAINT [FK_sys_users_team] 
    FOREIGN KEY ([team_id]) REFERENCES [dbo].[sys_teams] ([id]) ON SET NULL ON UPDATE CASCADE;
    PRINT '外键约束已添加';
END
ELSE
BEGIN
    PRINT '外键约束已存在';
END
