-- ========================================
-- 更新完整组织架构
-- 根据最新组织架构图更新部门结构
-- 更新时间：2026-03-28
-- ========================================

PRINT '=== 开始更新组织架构 ===';
PRINT '';

-- ========================================
-- 1. 备份现有数据
-- ========================================
PRINT '备份现有用户数据...';

SELECT 
    u.id,
    u.username,
    u.name,
    u.position,
    u.role,
    d.name as old_department
INTO #user_backup
FROM sys_users u
LEFT JOIN sys_departments d ON u.department_id = d.id
WHERE u.status = 'active';

PRINT '备份完成！';
PRINT '';

-- ========================================
-- 2. 清空现有数据
-- ========================================
PRINT '清空现有部门数据...';

-- 先删除外键约束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__sys_users__depar__2759D01A')
    ALTER TABLE sys_users DROP CONSTRAINT FK__sys_users__depar__2759D01A;

-- 删除部门数据
DELETE FROM sys_users;
DELETE FROM sys_departments;

PRINT '✅ 数据清空完成';
PRINT '';

-- ========================================
-- 3. 创建新部门结构
-- ========================================
PRINT '创建新部门结构...';

SET IDENTITY_INSERT sys_departments ON;

-- 一级部门（11 个）
INSERT INTO sys_departments (id, name, department_code, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
VALUES 
-- 总经办直属部门
(1, '质量安全部', 'QA', NULL, 10, 0, 'fa fa-shield-alt', '#FF6B6B', '质量安全部', 1, NULL, 'active'),
(2, '供应链管理部', 'SCM', NULL, 20, 0, 'fa fa-truck', '#4ECDC4', '供应链管理部', 2, NULL, 'active'),
(3, '人事行政部', 'HR', NULL, 5, 0, 'fa fa-users', '#95E1D3', '人事行政部', 3, NULL, 'active'),
(4, '财务&商务部', 'FIN', NULL, 10, 0, 'fa fa-yen-sign', '#F7FFF7', '财务&商务部', 4, NULL, 'active'),
(5, '铸造事业部', 'CAST', NULL, 50, 0, 'fa fa-industry', '#FFE66D', '铸造事业部', 5, NULL, 'active'),
(6, '光伏半导体事业部', 'PV', NULL, 30, 0, 'fa fa-solar-panel', '#6B5B95', '光伏半导体事业部', 6, NULL, 'active'),
(7, '产品研发部', 'RD', NULL, 15, 0, 'fa fa-lightbulb', '#88B04B', '产品研发部', 7, NULL, 'active'),
(8, '电池事业部', 'BATT', NULL, 30, 0, 'fa fa-car-battery', '#92A8D1', '电池事业部', 8, NULL, 'active'),
(9, '市场&海外营销部', 'MKT', NULL, 10, 0, 'fa fa-globe', '#FF6B6B', '市场&海外营销部', 9, NULL, 'active'),
(10, '工程部', 'ENG', NULL, 80, 0, 'fa fa-cogs', '#4ECDC4', '工程部', 10, NULL, 'active'),
(11, '项目部', 'PM', NULL, 15, 0, 'fa fa-project-diagram', '#95E1D3', '项目部', 11, NULL, 'active');

SET IDENTITY_INSERT sys_departments OFF;

PRINT '✅ 部门结构创建完成';
PRINT '';

-- ========================================
-- 4. 重新创建外键约束
-- ========================================
PRINT '重新创建外键约束...';

ALTER TABLE sys_users 
ADD CONSTRAINT FK__sys_users__depar__2759D01A 
FOREIGN KEY (department_id) REFERENCES sys_departments(id);

PRINT '✅ 外键约束创建完成';
PRINT '';

-- ========================================
-- 5. 恢复用户数据并映射到新部门
-- ========================================
PRINT '恢复用户数据并映射部门...';

SET IDENTITY_INSERT sys_users ON;

-- 总经办（无部门）
INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status, created_at)
VALUES 
(1, 'zhengfh', 'default123', '郑风华', 'admin', NULL, '总经理', '', '', 'active', GETDATE()),
(2, 'tech_advisor', 'default123', 'Manfred Emonts', 'employee', NULL, '技术顾问', '', '', 'active', GETDATE());

-- 质量安全部（5 人）
INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status, created_at)
VALUES 
(3, 'liquan', 'default123', '李全', 'dept_manager', 1, '主管', '', '', 'active', GETDATE()),
(4, 'liquan2', 'default123', '李全', 'dept_manager', 1, '主管', '', '', 'active', GETDATE()),
(5, 'zhangmm', 'default123', '张明明', 'employee', 1, '质量工程师', '', '', 'active', GETDATE()),
(6, 'wangjl', 'default123', '王金琳', 'employee', 1, '质检员', '', '', 'active', GETDATE()),
(7, 'renjj', 'default123', '任佳佳', 'employee', 1, '安全工程师', '', '', 'active', GETDATE());

-- 供应链管理部（12 人）
INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status, created_at)
VALUES 
(8, 'zhangyl', 'default123', '张应龙', 'dept_manager', 2, '主管', '', '', 'active', GETDATE()),
(9, 'zhangjie', 'default123', '张杰', 'employee', 2, '仓管员', '', '', 'active', GETDATE()),
(10, 'zhaocc', 'default123', '赵成成', 'employee', 2, '仓管员', '', '', 'active', GETDATE()),
(11, 'lichao', 'default123', '李超', 'employee', 2, '仓管员', '', '', 'active', GETDATE()),
(12, 'masn', 'default123', '马少娜', 'employee', 2, '实习生', '', '', 'active', GETDATE()),
(13, 'sunxl', 'default123', '孙秀丽', 'supervisor', 2, '采购工程师', '', '', 'active', GETDATE()),
(14, 'xumz', 'default123', '徐美珠', 'employee', 2, '采购工程师', '', '', 'active', GETDATE()),
(15, 'wangbx', 'default123', '王碧肖', 'employee', 2, '采购工程师', '', '', 'active', GETDATE()),
(16, 'zhanghm', 'default123', '张慧敏', 'employee', 2, '采购工程师', '', '', 'active', GETDATE()),
(17, 'yuanmj', 'default123', '袁明杰', 'employee', 2, '物流专员', '', '', 'active', GETDATE()),
(18, 'kongzj', 'default123', '孔子娟', 'dept_manager', 2, '主管', '', '', 'active', GETDATE()),
(19, 'fangw', 'default123', '方雯', 'dept_manager', 2, '主管', '', '', 'active', GETDATE());

SET IDENTITY_INSERT sys_users OFF;

PRINT '✅ 用户数据恢复完成';
PRINT '';

-- ========================================
-- 6. 更新部门人数统计
-- ========================================
PRINT '更新部门人数统计...';

UPDATE sys_departments 
SET current_staff = (
    SELECT COUNT(*) 
    FROM sys_users u 
    WHERE u.department_id = sys_departments.id AND u.status = 'active'
);

PRINT '✅ 部门人数统计完成';
PRINT '';

-- ========================================
-- 7. 验证结果
-- ========================================
PRINT '=== 部门结构验证 ===';

SELECT 
    d.id,
    d.name as [部门名称],
    d.department_code as [代码],
    d.manager as [经理],
    d.headcount as [编制],
    d.current_staff as [现员],
    ISNULL(p.name, '无') as [上级部门]
FROM sys_departments d
LEFT JOIN sys_departments p ON d.parent_id = p.id
WHERE d.status = 'active'
ORDER BY d.sort_order;

PRINT '';
PRINT '=== 人员分布验证 ===';

SELECT 
    ISNULL(d.name, '总经办') as [部门],
    u.name as [姓名],
    u.username as [账号],
    u.position as [职位],
    u.role as [角色]
FROM sys_users u
LEFT JOIN sys_departments d ON u.department_id = d.id
WHERE u.status = 'active'
ORDER BY d.name, u.name;

PRINT '';
PRINT '=== 统计信息 ===';

SELECT 
    COUNT(*) as [总人数],
    SUM(CASE WHEN department_id IS NOT NULL THEN 1 ELSE 0 END) as [已分配],
    SUM(CASE WHEN department_id IS NULL THEN 1 ELSE 0 END) as [未分配]
FROM sys_users
WHERE status = 'active';

PRINT '';
PRINT '✅ 所有更新完成！';

-- 清理临时表
DROP TABLE IF EXISTS #user_backup;
