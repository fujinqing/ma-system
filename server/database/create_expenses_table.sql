-- ================================================
-- 报销管理表 (sys_expenses)
-- ================================================

-- 创建报销表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_expenses]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[sys_expenses] (
    [id] INT IDENTITY(1,1) NOT NULL,                    -- 主键
    [expense_no] NVARCHAR(50) NOT NULL,                  -- 报销单号
    [title] NVARCHAR(200) NOT NULL,                       -- 报销事由
    [amount] DECIMAL(18,2) NOT NULL DEFAULT 0,            -- 报销金额
    [expense_type] NVARCHAR(50) NULL,                     -- 费用类型: travel/transport/meal/office/entertainment/training/other
    [expense_date] DATE NULL,                              -- 发生日期
    [description] NVARCHAR(MAX) NULL,                      -- 报销说明
    [applicant_id] INT NULL,                               -- 申请人ID
    [applicant_name] NVARCHAR(100) NULL,                   -- 申请人姓名
    [department] NVARCHAR(100) NULL,                       -- 部门
    [status] NVARCHAR(20) NOT NULL DEFAULT 'draft',       -- 状态: draft/pending/approved/rejected/paid
    [reviewer_id] INT NULL,                               -- 审批人ID
    [reviewer_name] NVARCHAR(100) NULL,                    -- 审批人姓名
    [review_comment] NVARCHAR(500) NULL,                  -- 审批意见
    [reviewed_at] DATETIME NULL,                           -- 审批时间
    [paid_at] DATETIME NULL,                               -- 打款时间
    [created_at] DATETIME DEFAULT GETDATE(),              -- 创建时间
    [updated_at] DATETIME DEFAULT GETDATE(),               -- 更新时间
    CONSTRAINT [PK_sys_expenses] PRIMARY KEY CLUSTERED ([id] ASC)
  );

  -- 创建索引
  CREATE NONCLUSTERED INDEX [IX_sys_expenses_expense_no] ON [dbo].[sys_expenses] ([expense_no] ASC);
  CREATE NONCLUSTERED INDEX [IX_sys_expenses_applicant_id] ON [dbo].[sys_expenses] ([applicant_id] ASC);
  CREATE NONCLUSTERED INDEX [IX_sys_expenses_status] ON [dbo].[sys_expenses] ([status] ASC);
  CREATE NONCLUSTERED INDEX [IX_sys_expenses_created_at] ON [dbo].[sys_expenses] ([created_at] DESC);
END
GO

-- ================================================
-- 报销单明细表 (sys_expense_items)
-- ================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_expense_items]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[sys_expense_items] (
    [id] INT IDENTITY(1,1) NOT NULL,                    -- 主键
    [expense_id] INT NOT NULL,                          -- 报销单ID
    [item_name] NVARCHAR(200) NOT NULL,                  -- 项目名称
    [item_amount] DECIMAL(18,2) NOT NULL DEFAULT 0,      -- 项目金额
    [item_date] DATE NULL,                               -- 发生日期
    [item_description] NVARCHAR(500) NULL,               -- 项目说明
    [receipt_url] NVARCHAR(500) NULL,                    -- 收据/发票URL
    [created_at] DATETIME DEFAULT GETDATE(),             -- 创建时间
    CONSTRAINT [PK_sys_expense_items] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_sys_expense_items_expense] FOREIGN KEY ([expense_id]) REFERENCES [dbo].[sys_expenses] ([id]) ON DELETE CASCADE
  );

  CREATE NONCLUSTERED INDEX [IX_sys_expense_items_expense_id] ON [dbo].[sys_expense_items] ([expense_id] ASC);
END
GO

-- ================================================
-- 费用类型字典表 (sys_expense_types)
-- ================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_expense_types]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[sys_expense_types] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [type_code] NVARCHAR(50) NOT NULL,
    [type_name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(500) NULL,
    [max_amount] DECIMAL(18,2) NULL,                     -- 单笔最高金额
    [requires_receipt] BIT DEFAULT 1,                   -- 是否需要发票
    [is_active] BIT DEFAULT 1,
    [sort_order] INT DEFAULT 0,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [PK_sys_expense_types] PRIMARY KEY CLUSTERED ([id] ASC)
  );

  -- 插入默认费用类型
  INSERT INTO [dbo].[sys_expense_types] ([type_code], [type_name], [description], [max_amount], [requires_receipt], [sort_order])
  VALUES
    ('travel', '差旅费', '出差产生的交通、住宿、餐饮等费用', 10000.00, 1, 1),
    ('transport', '交通费', '日常交通出行费用', 2000.00, 1, 2),
    ('meal', '餐饮费', '业务招待餐饮费用', 5000.00, 1, 3),
    ('office', '办公费', '办公用品、设备维修等费用', 5000.00, 1, 4),
    ('entertainment', '招待费', '客户招待费用', 10000.00, 1, 5),
    ('training', '培训费', '员工培训相关费用', 20000.00, 1, 6),
    ('other', '其他', '其他费用', 5000.00, 1, 99);
END
GO
