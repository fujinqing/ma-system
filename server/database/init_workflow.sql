-- =====================================================
-- 流程管理模块数据库初始化脚本
-- WMS (Workflow Management System)
-- =====================================================

USE M-A_OP_ODB;
GO

-- 1. 流程定义表
IF OBJECT_ID('dbo.wf_flow_definition','U') IS NULL
CREATE TABLE dbo.wf_flow_definition (
    flow_id INT IDENTITY(1,1) PRIMARY KEY,
    flow_code NVARCHAR(50) NOT NULL UNIQUE,
    flow_name NVARCHAR(200) NOT NULL,
    flow_desc NVARCHAR(1000) NULL,
    module_code NVARCHAR(50) NOT NULL,
    is_default BIT DEFAULT 0,
    version_count INT DEFAULT 1,
    current_version INT DEFAULT 1,
    status NVARCHAR(20) DEFAULT 'draft',
    created_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    INDEX IX_module_code (module_code),
    INDEX IX_status (status)
);
GO

-- 2. 流程版本表
IF OBJECT_ID('dbo.wf_flow_version','U') IS NULL
CREATE TABLE dbo.wf_flow_version (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    flow_id INT NOT NULL,
    version_number INT NOT NULL,
    flow_config NVARCHAR(MAX) NOT NULL,
    node_count INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'draft',
    change_desc NVARCHAR(500) NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (flow_id) REFERENCES dbo.wf_flow_definition(flow_id) ON DELETE CASCADE,
    INDEX IX_flow_id (flow_id)
);
GO

-- 3. 流程节点定义表
IF OBJECT_ID('dbo.wf_flow_node','U') IS NULL
CREATE TABLE dbo.wf_flow_node (
    node_id INT IDENTITY(1,1) PRIMARY KEY,
    version_id INT NOT NULL,
    node_code NVARCHAR(50) NOT NULL,
    node_name NVARCHAR(200) NOT NULL,
    node_type NVARCHAR(30) NOT NULL,
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    prev_node_ids NVARCHAR(500) NULL,
    next_node_ids NVARCHAR(500) NULL,
    is_start BIT DEFAULT 0,
    is_end BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (version_id) REFERENCES dbo.wf_flow_version(version_id) ON DELETE CASCADE,
    INDEX IX_version_id (version_id),
    INDEX IX_node_type (node_type)
);
GO

-- 4. 流程节点配置表
IF OBJECT_ID('dbo.wf_node_config','U') IS NULL
CREATE TABLE dbo.wf_node_config (
    config_id INT IDENTITY(1,1) PRIMARY KEY,
    node_id INT NOT NULL,
    config_key NVARCHAR(100) NOT NULL,
    config_value NVARCHAR(MAX) NULL,
    FOREIGN KEY (node_id) REFERENCES dbo.wf_flow_node(node_id) ON DELETE CASCADE,
    INDEX IX_node_id (node_id),
    UNIQUE INDEX IX_node_key (node_id, config_key)
);
GO

-- 5. 审批规则表
IF OBJECT_ID('dbo.wf_approval_rule','U') IS NULL
CREATE TABLE dbo.wf_approval_rule (
    rule_id INT IDENTITY(1,1) PRIMARY KEY,
    node_id INT NOT NULL,
    rule_type NVARCHAR(30) NOT NULL,
    rule_value NVARCHAR(MAX) NULL,
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (node_id) REFERENCES dbo.wf_flow_node(node_id) ON DELETE CASCADE,
    INDEX IX_node_id (node_id)
);
GO

-- 6. 审批组表
IF OBJECT_ID('dbo.wf_approval_group','U') IS NULL
CREATE TABLE dbo.wf_approval_group (
    group_id INT IDENTITY(1,1) PRIMARY KEY,
    group_code NVARCHAR(50) NOT NULL UNIQUE,
    group_name NVARCHAR(200) NOT NULL,
    group_type NVARCHAR(30) NOT NULL,
    member_ids NVARCHAR(MAX) NULL,
    member_roles NVARCHAR(MAX) NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    INDEX IX_group_type (group_type)
);
GO

-- 7. 流程实例表
IF OBJECT_ID('dbo.wf_instance','U') IS NULL
CREATE TABLE dbo.wf_instance (
    instance_id INT IDENTITY(1,1) PRIMARY KEY,
    flow_id INT NOT NULL,
    version_id INT NOT NULL,
    biz_id NVARCHAR(100) NOT NULL,
    module_code NVARCHAR(50) NOT NULL,
    biz_data NVARCHAR(MAX) NULL,
    current_node_id INT NULL,
    status NVARCHAR(30) DEFAULT 'running',
    start_user_id INT NULL,
    start_at DATETIME DEFAULT GETDATE(),
    end_at DATETIME NULL,
    trace_id NVARCHAR(100) NULL,
    INDEX IX_flow_id (flow_id),
    INDEX IX_biz_id (biz_id),
    INDEX IX_module_code (module_code),
    INDEX IX_status (status),
    INDEX IX_start_user (start_user_id),
    INDEX IX_trace_id (trace_id)
);
GO

-- 8. 实例节点记录表
IF OBJECT_ID('dbo.wf_instance_node','U') IS NULL
CREATE TABLE dbo.wf_instance_node (
    record_id INT IDENTITY(1,1) PRIMARY KEY,
    instance_id INT NOT NULL,
    node_id INT NOT NULL,
    node_code NVARCHAR(50) NOT NULL,
    node_type NVARCHAR(30) NOT NULL,
    status NVARCHAR(30) DEFAULT 'pending',
    assignee_id INT NULL,
    assignee_name NVARCHAR(100) NULL,
    assigned_at DATETIME NULL,
    finished_at DATETIME NULL,
    action NVARCHAR(30) NULL,
    comment NVARCHAR(500) NULL,
    INDEX IX_instance_id (instance_id),
    INDEX IX_node_id (node_id),
    INDEX IX_assignee (assignee_id),
    INDEX IX_status (status)
);
GO

-- 9. 审批历史表
IF OBJECT_ID('dbo.wf_approval_history','U') IS NULL
CREATE TABLE dbo.wf_approval_history (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    instance_id INT NOT NULL,
    record_id INT NOT NULL,
    operator_id INT NOT NULL,
    operator_name NVARCHAR(100) NOT NULL,
    action NVARCHAR(30) NOT NULL,
    comment NVARCHAR(500) NULL,
    operate_at DATETIME DEFAULT GETDATE(),
    INDEX IX_instance_id (instance_id),
    INDEX IX_record_id (record_id),
    INDEX IX_operator (operator_id)
);
GO

-- 10. 模块绑定表
IF OBJECT_ID('dbo.wf_module_binding','U') IS NULL
CREATE TABLE dbo.wf_module_binding (
    binding_id INT IDENTITY(1,1) PRIMARY KEY,
    flow_id INT NOT NULL,
    module_code NVARCHAR(50) NOT NULL,
    is_default BIT DEFAULT 0,
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (flow_id) REFERENCES dbo.wf_flow_definition(flow_id) ON DELETE CASCADE,
    UNIQUE INDEX IX_flow_module (flow_id, module_code),
    INDEX IX_module_code (module_code)
);
GO

-- 11. 流程运行日志表
IF OBJECT_ID('dbo.wf_run_log','U') IS NULL
CREATE TABLE dbo.wf_run_log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    instance_id INT NOT NULL,
    trace_id NVARCHAR(100) NULL,
    log_level NVARCHAR(20) DEFAULT 'info',
    node_code NVARCHAR(50) NULL,
    message NVARCHAR(1000) NOT NULL,
    details NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    INDEX IX_instance_id (instance_id),
    INDEX IX_trace_id (trace_id),
    INDEX IX_created_at (created_at)
);
GO

-- 12. 流程节点模板表
IF OBJECT_ID('dbo.wf_node_template','U') IS NULL
CREATE TABLE dbo.wf_node_template (
    template_id INT IDENTITY(1,1) PRIMARY KEY,
    template_code NVARCHAR(50) NOT NULL UNIQUE,
    template_name NVARCHAR(200) NOT NULL,
    node_type NVARCHAR(30) NOT NULL,
    template_config NVARCHAR(MAX) NOT NULL,
    is_public BIT DEFAULT 1,
    created_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    INDEX IX_node_type (node_type)
);
GO

-- 13. 待办通知表
IF OBJECT_ID('dbo.wf_todo','U') IS NULL
CREATE TABLE dbo.wf_todo (
    todo_id INT IDENTITY(1,1) PRIMARY KEY,
    instance_id INT NOT NULL,
    record_id INT NOT NULL,
    assignee_id INT NOT NULL,
    assignee_name NVARCHAR(100) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    content NVARCHAR(500) NULL,
    priority NVARCHAR(20) DEFAULT 'normal',
    due_date DATETIME NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    remind_at DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    INDEX IX_assignee (assignee_id),
    INDEX IX_instance_id (instance_instance_id),
    INDEX IX_status (status),
    INDEX IX_due_date (due_date)
);
GO

PRINT '流程管理模块数据库表创建完成';
GO