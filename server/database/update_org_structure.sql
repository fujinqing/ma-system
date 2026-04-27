-- 更新组织架构数据
-- 根据组织架构图更新部门、小组和人员信息
-- 更新时间：2026-03-28

-- ========================================
-- 1. 更新部门结构
-- ========================================

-- 清空现有部门数据（级联删除用户）
DELETE FROM sys_users;
DELETE FROM sys_departments;

-- 重置自增 ID
DBCC CHECKIDENT ('sys_users', RESEED, 0);
DBCC CHECKIDENT ('sys_departments', RESEED, 0);

-- 插入一级部门
INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, status) VALUES
('质量安全部', '李全', 4, 0, 'fa fa-shield-alt', '#FF6B6B', '质量安全部', 1, 'active'),
('供应链管理部', '孔子娟', 12, 0, 'fa fa-truck', '#4ECDC4', '供应链管理部', 2, 'active');

-- 插入质量安全部的子部门
INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '质量部', '李全', 3, 0, 'fa fa-check-circle', '#95E1D3', '质量部', 1, id, 'active'
FROM sys_departments WHERE name = '质量安全部' AND parent_id IS NULL;

INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '安全部', '李全', 2, 0, 'fa fa-user-shield', '#F7FFF7', '安全部', 2, id, 'active'
FROM sys_departments WHERE name = '质量安全部' AND parent_id IS NULL;

-- 插入供应链管理部的子部门
INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '仓库部', '张应龙', 5, 0, 'fa fa-warehouse', '#FFE66D', '仓库部', 1, id, 'active'
FROM sys_departments WHERE name = '供应链管理部' AND parent_id IS NULL;

INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '采购&物流部', '孙秀丽', 6, 0, 'fa fa-shopping-cart', '#6B5B95', '采购&物流部', 2, id, 'active'
FROM sys_departments WHERE name = '供应链管理部' AND parent_id IS NULL;

-- 供应链部（直属）
INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '供应链部', '孔子娟', 1, 0, 'fa fa-link', '#88B04B', '供应链部', 3, id, 'active'
FROM sys_departments WHERE name = '供应链管理部' AND parent_id IS NULL;

-- 市场&海外营销部（直属）
INSERT INTO sys_departments (name, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
SELECT '市场&海外营销部', '方雯', 1, 0, 'fa fa-globe', '#92A8D1', '市场&海外营销部', 4, id, 'active'
FROM sys_departments WHERE name = '供应链管理部' AND parent_id IS NULL;

PRINT '✅ 部门结构更新完成';

-- ========================================
-- 2. 更新人员数据
-- ========================================

-- 获取部门 ID
DECLARE @质量安全部 INT = (SELECT id FROM sys_departments WHERE name = '质量安全部' AND parent_id IS NULL);
DECLARE @供应链管理部 INT = (SELECT id FROM sys_departments WHERE name = '供应链管理部' AND parent_id IS NULL);
DECLARE @质量部 INT = (SELECT id FROM sys_departments WHERE name = '质量部' AND parent_id = @质量安全部);
DECLARE @安全部 INT = (SELECT id FROM sys_departments WHERE name = '安全部' AND parent_id = @质量安全部);
DECLARE @仓库部 INT = (SELECT id FROM sys_departments WHERE name = '仓库部' AND parent_id = @供应链管理部);
DECLARE @采购物流部 INT = (SELECT id FROM sys_departments WHERE name = '采购&物流部' AND parent_id = @供应链管理部);
DECLARE @供应链部 INT = (SELECT id FROM sys_departments WHERE name = '供应链部' AND parent_id = @供应链管理部);
DECLARE @市场部 INT = (SELECT id FROM sys_departments WHERE name = '市场&海外营销部' AND parent_id = @供应链管理部);

-- 插入质量安全部 - 质量部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('liquan', 'default123', '李全', 'dept_manager', @质量部, '主管', '', '', 'active', GETDATE()),
('zhangmm', 'default123', '张明明', 'employee', @质量部, '质量工程师', '', '', 'active', GETDATE()),
('wangjl', 'default123', '王金琳', 'employee', @质量部, '质检员', '', '', 'active', GETDATE());

-- 插入质量安全部 - 安全部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('liquan_safe', 'default123', '李全', 'dept_manager', @安全部, '主管', '', '', 'active', GETDATE()),
('renjj', 'default123', '任佳佳', 'employee', @安全部, '安全工程师', '', '', 'active', GETDATE());

-- 插入供应链管理部 - 仓库部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('zhangyl', 'default123', '张应龙', 'dept_manager', @仓库部, '主管', '', '', 'active', GETDATE()),
('zhangjie', 'default123', '张杰', 'employee', @仓库部, '仓管员', '', '', 'active', GETDATE()),
('zhaocc', 'default123', '赵成成', 'employee', @仓库部, '仓管员', '', '', 'active', GETDATE()),
('lichao', 'default123', '李超', 'employee', @仓库部, '仓管员', '', '', 'active', GETDATE()),
('masn', 'default123', '马少娜', 'employee', @仓库部, '实习生', '', '', 'active', GETDATE());

-- 插入供应链管理部 - 采购&物流部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('sunxl', 'default123', '孙秀丽', 'supervisor', @采购物流部, '采购工程师', '', '', 'active', GETDATE()),
('xumz', 'default123', '徐美珠', 'employee', @采购物流部, '采购工程师', '', '', 'active', GETDATE()),
('wangbx', 'default123', '王碧肖', 'employee', @采购物流部, '采购工程师', '', '', 'active', GETDATE()),
('zhanghm', 'default123', '张慧敏', 'employee', @采购物流部, '采购工程师', '', '', 'active', GETDATE()),
('yuanmj', 'default123', '袁明杰', 'employee', @采购物流部, '物流专员', '', '', 'active', GETDATE());

-- 插入供应链管理部 - 供应链部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('kongzj', 'default123', '孔子娟', 'dept_manager', @供应链部, '主管', '', '', 'active', GETDATE());

-- 插入供应链管理部 - 市场&海外营销部人员
INSERT INTO sys_users (username, password_hash, name, role, department_id, position, phone, email, status, created_at) VALUES
('fangw', 'default123', '方雯', 'dept_manager', @市场部, '主管', '', '', 'active', GETDATE());

PRINT '✅ 人员数据更新完成';

-- ========================================
-- 3. 更新部门人数统计
-- ========================================

UPDATE sys_departments 
SET current_staff = (
    SELECT COUNT(*) FROM sys_users u 
    WHERE u.department_id = sys_departments.id AND u.status = 'active'
);

PRINT '✅ 部门人数统计更新完成';

-- ========================================
-- 4. 查询验证
-- ========================================

PRINT '';
PRINT '=== 部门结构验证 ===';
SELECT 
    d.name as [部门名称],
    d.manager as [部门经理],
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
    d.name as [部门],
    u.name as [姓名],
    u.position as [职位],
    u.role as [角色]
FROM sys_users u
JOIN sys_departments d ON u.department_id = d.id
WHERE u.status = 'active'
ORDER BY d.name, u.name;

PRINT '';
PRINT '✅ 所有更新完成！';
