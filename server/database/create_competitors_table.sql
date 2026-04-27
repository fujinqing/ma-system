-- 创建竞争对手表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[competitors]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[competitors](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [name] [nvarchar](100) NOT NULL,
        [company] [nvarchar](100) NOT NULL,
        [industry] [nvarchar](50) NULL,
        [strength] [nvarchar](20) NULL,
        [market_share] [decimal](10, 2) NULL,
        [founded_date] [date] NULL,
        [key_products] [nvarchar](500) NULL,
        [core_advantages] [nvarchar](500) NULL,
        [disadvantages] [nvarchar](500) NULL,
        [market_strategy] [nvarchar](500) NULL,
        [contact_info] [nvarchar](200) NULL,
        [remarks] [nvarchar](500) NULL,
        [created_at] [datetime] NOT NULL DEFAULT GETDATE(),
        [updated_at] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_competitors] PRIMARY KEY CLUSTERED 
        (
            [id] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
    
    -- 添加索引
    CREATE NONCLUSTERED INDEX [IX_competitors_name] ON [dbo].[competitors]
    (
        [name] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    
    CREATE NONCLUSTERED INDEX [IX_competitors_industry] ON [dbo].[competitors]
    (
        [industry] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    
    CREATE NONCLUSTERED INDEX [IX_competitors_strength] ON [dbo].[competitors]
    (
        [strength] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    
    -- 插入示例数据
    INSERT INTO [dbo].[competitors] ([name], [company], [industry], [strength], [market_share], [key_products], [core_advantages], [disadvantages], [market_strategy])
    VALUES
        ('竞争对手A', 'A公司', 'automation', 'high', 25.5, '自动化生产线,机器人', '技术领先,品牌知名度高', '价格昂贵', '高端市场策略'),
        ('竞争对手B', 'B公司', 'non_standard', 'medium', 15.2, '非标设备,定制化解决方案', '定制能力强', '交付周期长', '行业细分策略'),
        ('竞争对手C', 'C公司', 'electronics', 'low', 8.7, '电子制造设备', '价格优势', '技术更新慢', '成本领先策略');
    
    PRINT '竞争对手表创建成功，并插入了示例数据';
END
ELSE
BEGIN
    PRINT '竞争对手表已存在';
END