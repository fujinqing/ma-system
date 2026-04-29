-- 客户移交记录表
-- 用于记录客户移交历史，全流程日志留痕

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_transfer_logs' AND xtype='U')
BEGIN
    CREATE TABLE customer_transfer_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT NOT NULL,
        from_user_id INT,
        to_user_id INT NOT NULL,
        transfer_type NVARCHAR(50) NOT NULL,  -- manual/auto/dismiss
        transfer_reason NVARCHAR(500),
        transfer_remark NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'completed',  -- pending/completed/cancelled
        created_at DATETIME DEFAULT GETDATE(),
        created_by INT,

        CONSTRAINT FK_transfer_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT FK_transfer_from_user FOREIGN KEY (from_user_id) REFERENCES sys_users(id),
        CONSTRAINT FK_transfer_to_user FOREIGN KEY (to_user_id) REFERENCES sys_users(id)
    );

    CREATE INDEX idx_transfer_customer ON customer_transfer_logs(customer_id);
    CREATE INDEX idx_transfer_from_user ON customer_transfer_logs(from_user_id);
    CREATE INDEX idx_transfer_to_user ON customer_transfer_logs(to_user_id);
    CREATE INDEX idx_transfer_created_at ON customer_transfer_logs(created_at);

    PRINT 'customer_transfer_logs表创建成功';
END
ELSE
BEGIN
    PRINT 'customer_transfer_logs表已存在';
END
GO

-- 客户数据权限配置表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_data_permissions' AND xtype='U')
BEGIN
    CREATE TABLE customer_data_permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        permission_level NVARCHAR(50) NOT NULL,  -- personal/department/all
        department_id INT,
        allowed_customer_ids NVARCHAR(MAX),  -- JSON array for specific customers
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_permission_user FOREIGN KEY (user_id) REFERENCES sys_users(id)
    );

    CREATE INDEX idx_permission_user ON customer_data_permissions(user_id);

    PRINT 'customer_data_permissions表创建成功';
END
ELSE
BEGIN
    PRINT 'customer_data_permissions表已存在';
END
GO
