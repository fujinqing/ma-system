-- ========================================
-- 创建职位管理表
-- 更新时间：2026-03-28
-- ========================================

PRINT '=== 开始创建职位管理表 ===';
PRINT '';

-- 创建职位表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_positions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sys_positions] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [position_code] NVARCHAR(50) NOT NULL,
        [position_name] NVARCHAR(100) NOT NULL,
        [department_id] INT NULL,
        [position_type] NVARCHAR(50) DEFAULT 'common', -- common:普通职位，management:管理职位，technical:技术职位
        [description] NVARCHAR(500) NULL,
        [sort_order] INT DEFAULT 0,
        [status] NVARCHAR(20) DEFAULT 'active', -- active, inactive
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [PK_sys_positions] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UK_position_code] UNIQUE NONCLUSTERED ([position_code] ASC)
    );
    
    PRINT '✅ 职位表创建成功';
END
ELSE
BEGIN
    PRINT '⚠️  职位表已存在';
END

-- 添加外键约束（关联部门表）
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_sys_positions_department')
BEGIN
    ALTER TABLE [dbo].[sys_positions] 
    ADD CONSTRAINT [FK_sys_positions_department] 
    FOREIGN KEY ([department_id]) REFERENCES [dbo].[sys_departments]([id]);
    
    PRINT '✅ 外键约束创建成功';
END

-- 添加索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sys_positions_department')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_sys_positions_department] 
    ON [dbo].[sys_positions] ([department_id] ASC);
    
    PRINT '✅ 索引创建成功';
END

-- 插入初始职位数据
PRINT '';
PRINT '插入初始职位数据...';

SET IDENTITY_INSERT [dbo].[sys_positions] ON;

-- 管理职位
INSERT INTO [dbo].[sys_positions] ([id], [position_code], [position_name], [department_id], [position_type], [description], [sort_order], [status])
VALUES 
(1, 'GM', '总经理', NULL, 'management', '公司最高管理者', 1, 'active'),
(2, 'DEPT_MANAGER', '部门经理', NULL, 'management', '部门负责人', 2, 'active'),
(3, 'SUPERVISOR', '主管', NULL, 'management', '团队主管', 3, 'active'),
(4, 'ASSISTANT_MANAGER', '助理经理', NULL, 'management', '经理助理', 4, 'active');

-- 技术职位
INSERT INTO [dbo].[sys_positions] ([id], [position_code], [position_name], [department_id], [position_type], [description], [sort_order], [status])
VALUES 
(5, 'CHIEF_ENGINEER', '总工程师', NULL, 'technical', '技术负责人', 1, 'active'),
(6, 'SENIOR_ENGINEER', '高级工程师', NULL, 'technical', '资深技术专家', 2, 'active'),
(7, 'ENGINEER', '工程师', NULL, 'technical', '技术人员', 3, 'active'),
(8, 'ASSISTANT_ENGINEER', '助理工程师', NULL, 'technical', '初级技术人员', 4, 'active'),
(9, 'TECHNICIAN', '技术员', NULL, 'technical', '技术操作人员', 5, 'active');

-- 专业职位（按部门）
INSERT INTO [dbo].[sys_positions] ([id], [position_code], [position_name], [department_id], [position_type], [description], [sort_order], [status])
VALUES 
(10, 'QA_ENGINEER', '质量工程师', 1, 'technical', '负责质量管理', 1, 'active'),
(11, 'QC_INSPECTOR', '质检员', 1, 'technical', '质量检验', 2, 'active'),
(12, 'SAFETY_ENGINEER', '安全工程师', 1, 'technical', '安全管理', 3, 'active'),
(13, 'PROCUREMENT_ENGINEER', '采购工程师', 2, 'technical', '采购管理', 1, 'active'),
(14, 'LOGISTICS_SPECIALIST', '物流专员', 2, 'technical', '物流管理', 2, 'active'),
(15, 'WAREHOUSE_KEEPER', '仓管员', 2, 'technical', '仓库管理', 3, 'active'),
(16, 'HR_SPECIALIST', '人事专员', 3, 'technical', '人事管理', 1, 'active'),
(17, 'ADMIN_SPECIALIST', '行政专员', 3, 'technical', '行政管理', 2, 'active'),
(18, 'ACCOUNTANT', '会计', 4, 'technical', '财务会计', 1, 'active'),
(19, 'FINANCIAL_SPECIALIST', '财务专员', 4, 'technical', '财务管理', 2, 'active'),
(20, 'SALES_ENGINEER', '销售工程师', 9, 'technical', '销售管理', 1, 'active'),
(21, 'MARKETING_SPECIALIST', '市场专员', 9, 'technical', '市场推广', 2, 'active');

-- 通用职位
INSERT INTO [dbo].[sys_positions] ([id], [position_code], [position_name], [department_id], [position_type], [description], [sort_order], [status])
VALUES 
(22, 'INTERN', '实习生', NULL, 'common', '实习人员', 1, 'active'),
(23, 'CONSULTANT', '顾问', NULL, 'common', '咨询顾问', 2, 'active'),
(24, 'ASSISTANT', '助理', NULL, 'common', '行政助理', 3, 'active');

SET IDENTITY_INSERT [dbo].[sys_positions] OFF;

PRINT '✅ 初始职位数据插入成功';

-- 显示所有职位
PRINT '';
PRINT '=== 职位列表 ===';

SELECT 
    p.id,
    p.position_code as [职位代码],
    p.position_name as [职位名称],
    d.name as [所属部门],
    CASE p.position_type 
        WHEN 'management' THEN '管理职位'
        WHEN 'technical' THEN '技术职位'
        WHEN 'common' THEN '通用职位'
        ELSE '其他'
    END as [职位类型],
    p.description as [描述],
    p.sort_order as [排序],
    CASE p.status 
        WHEN 'active' THEN '启用'
        WHEN 'inactive' THEN '禁用'
        ELSE '未知'
    END as [状态]
FROM [dbo].[sys_positions] p
LEFT JOIN [dbo].[sys_departments] d ON p.department_id = d.id
ORDER BY p.position_type, p.sort_order, p.id;

PRINT '';
PRINT '✅ 职位管理表创建完成！';
