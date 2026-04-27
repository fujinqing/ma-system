-- 添加父小组字段到 sys_teams 表
-- 支持小组嵌套（小组下面再创建小组）

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[sys_teams]') AND name = 'parent_team_id')
BEGIN
    ALTER TABLE [dbo].[sys_teams] ADD [parent_team_id] INT NULL;

    ALTER TABLE [dbo].[sys_teams]
    ADD CONSTRAINT [FK_sys_teams_parent_team]
    FOREIGN KEY ([parent_team_id])
    REFERENCES [dbo].[sys_teams] ([id])
    ON SET NULL ON UPDATE CASCADE;

    PRINT '已添加 parent_team_id 字段到 sys_teams 表';
END
ELSE
BEGIN
    PRINT 'parent_team_id 字段已存在';
END
