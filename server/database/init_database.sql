-- 数据库初始化脚本
-- 执行顺序：先创建表，再插入数据

-- 1. 创建部门表并初始化数据
:r init_departments.sql

-- 2. 创建用户表并初始化数据
:r init_users.sql

-- 显示完成消息
PRINT '数据库初始化完成！';
GO
