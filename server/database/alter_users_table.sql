-- 修改 sys_users 表结构
-- 执行时间：2026-04-06
-- 说明：添加性别和入职时间字段，删除用户名字段

-- 1. 添加性别字段 (nvarchar, 默认值 'male')
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sys_users') AND name = 'gender')
BEGIN
    ALTER TABLE sys_users ADD gender NVARCHAR(10) DEFAULT 'male';
    PRINT '成功添加 gender 字段';
END
ELSE
BEGIN
    PRINT 'gender 字段已存在';
END

-- 2. 添加入职时间字段 (date, 可为空)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sys_users') AND name = 'join_date')
BEGIN
    ALTER TABLE sys_users ADD join_date DATE NULL;
    PRINT '成功添加 join_date 字段';
END
ELSE
BEGIN
    PRINT 'join_date 字段已存在';
END

-- 3. 删除 username 字段（如果存在）
-- 先删除依赖的约束和索引
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ__sys_user__F3DBC57221A0F6C4')
BEGIN
    ALTER TABLE sys_users DROP CONSTRAINT UQ__sys_user__F3DBC57221A0F6C4;
    PRINT '成功删除唯一约束 UQ__sys_user__F3DBC57221A0F6C4';
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_username')
BEGIN
    DROP INDEX idx_user_username ON sys_users;
    PRINT '成功删除索引 idx_user_username';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sys_users') AND name = 'username')
BEGIN
    ALTER TABLE sys_users DROP COLUMN username;
    PRINT '成功删除 username 字段';
END
ELSE
BEGIN
    PRINT 'username 字段不存在，无需删除';
END

-- 4. 验证表结构
PRINT '表结构修改完成！';
PRINT '当前 sys_users 表的字段：';

SELECT 
    c.name AS '字段名',
    t.name AS '数据类型',
    c.max_length AS '长度',
    c.is_nullable AS '允许 NULL',
    c.default_object_id AS '默认值'
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('sys_users')
ORDER BY c.column_id;
