-- =====================================================
-- M-A_OP_ODB 存储过程脚本
-- 用于用户、部门的CRUD操作
-- 创建日期: 2026-03-24
-- =====================================================

USE M-A_OP_ODB;
GO

-- =====================================================
-- 用户存储过程
-- =====================================================

-- 创建用户
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_InsertUser') AND type in (N'P'))
    DROP PROCEDURE sp_InsertUser
GO

CREATE PROCEDURE sp_InsertUser
    @username NVARCHAR(50),
    @password NVARCHAR(255),
    @name NVARCHAR(100),
    @role NVARCHAR(20) = 'employee',
    @departmentId INT,
    @position NVARCHAR(100),
    @phone NVARCHAR(20) = NULL,
    @email NVARCHAR(100) = NULL
AS
BEGIN
    INSERT INTO users (username, password, name, role, department_id, position, phone, email)
    VALUES (@username, @password, @name, @role, @departmentId, @position, @phone, @email);
    
    SELECT SCOPE_IDENTITY() as id;
END
GO

-- 更新用户
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_UpdateUser') AND type in (N'P'))
    DROP PROCEDURE sp_UpdateUser
GO

CREATE PROCEDURE sp_UpdateUser
    @id INT,
    @name NVARCHAR(100),
    @role NVARCHAR(20),
    @departmentId INT,
    @position NVARCHAR(100),
    @phone NVARCHAR(20),
    @email NVARCHAR(100),
    @status INT
AS
BEGIN
    UPDATE users SET
        name = @name,
        role = @role,
        department_id = @departmentId,
        position = @position,
        phone = @phone,
        email = @email,
        status = @status,
        updated_at = GETDATE()
    WHERE id = @id;
END
GO

-- 删除用户
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_DeleteUser') AND type in (N'P'))
    DROP PROCEDURE sp_DeleteUser
GO

CREATE PROCEDURE sp_DeleteUser
    @id INT
AS
BEGIN
    DELETE FROM users WHERE id = @id;
END
GO

-- =====================================================
-- 部门存储过程
-- =====================================================

-- 创建部门
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_InsertDepartment') AND type in (N'P'))
    DROP PROCEDURE sp_InsertDepartment
GO

CREATE PROCEDURE sp_InsertDepartment
    @name NVARCHAR(100),
    @icon NVARCHAR(50) = NULL,
    @color NVARCHAR(20) = NULL,
    @manager NVARCHAR(100) = NULL,
    @parentId INT = NULL,
    @sortOrder INT = 0
AS
BEGIN
    INSERT INTO departments (name, icon, color, manager, parent_id, sort_order)
    VALUES (@name, @icon, @color, @manager, @parentId, @sortOrder);
    
    SELECT SCOPE_IDENTITY() as id;
END
GO

-- 更新部门
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_UpdateDepartment') AND type in (N'P'))
    DROP PROCEDURE sp_UpdateDepartment
GO

CREATE PROCEDURE sp_UpdateDepartment
    @id INT,
    @name NVARCHAR(100),
    @icon NVARCHAR(50),
    @color NVARCHAR(20),
    @manager NVARCHAR(100),
    @parentId INT,
    @sortOrder INT,
    @status INT
AS
BEGIN
    UPDATE departments SET
        name = @name,
        icon = @icon,
        color = @color,
        manager = @manager,
        parent_id = @parentId,
        sort_order = @sortOrder,
        status = @status,
        updated_at = GETDATE()
    WHERE id = @id;
END
GO

-- 删除部门
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_DeleteDepartment') AND type in (N'P'))
    DROP PROCEDURE sp_DeleteDepartment
GO

CREATE PROCEDURE sp_DeleteDepartment
    @id INT
AS
BEGIN
    DELETE FROM departments WHERE id = @id;
END
GO

-- =====================================================
-- 供应商存储过程
-- =====================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_InsertSupplier') AND type in (N'P'))
    DROP PROCEDURE sp_InsertSupplier
GO

CREATE PROCEDURE sp_InsertSupplier
    @name NVARCHAR(200),
    @code NVARCHAR(50) = NULL,
    @contactPerson NVARCHAR(100) = NULL,
    @contactPhone NVARCHAR(20) = NULL,
    @contactEmail NVARCHAR(100) = NULL,
    @address NVARCHAR(500) = NULL,
    @category NVARCHAR(50) = NULL,
    @rating INT = 0
AS
BEGIN
    INSERT INTO suppliers (name, code, contact_person, contact_phone, contact_email, address, category, rating)
    VALUES (@name, @code, @contactPerson, @contactPhone, @contactEmail, @address, @category, @rating);
    
    SELECT SCOPE_IDENTITY() as id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_UpdateSupplier') AND type in (N'P'))
    DROP PROCEDURE sp_UpdateSupplier
GO

CREATE PROCEDURE sp_UpdateSupplier
    @id INT,
    @name NVARCHAR(200),
    @contactPerson NVARCHAR(100),
    @contactPhone NVARCHAR(20),
    @contactEmail NVARCHAR(100),
    @address NVARCHAR(500),
    @category NVARCHAR(50),
    @rating INT,
    @status INT
AS
BEGIN
    UPDATE suppliers SET
        name = @name,
        contact_person = @contactPerson,
        contact_phone = @contactPhone,
        contact_email = @contactEmail,
        address = @address,
        category = @category,
        rating = @rating,
        status = @status,
        updated_at = GETDATE()
    WHERE id = @id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_DeleteSupplier') AND type in (N'P'))
    DROP PROCEDURE sp_DeleteSupplier
GO

CREATE PROCEDURE sp_DeleteSupplier
    @id INT
AS
BEGIN
    DELETE FROM suppliers WHERE id = @id;
END
GO

-- =====================================================
-- 物料存储过程
-- =====================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_InsertMaterial') AND type in (N'P'))
    DROP PROCEDURE sp_InsertMaterial
GO

CREATE PROCEDURE sp_InsertMaterial
    @code NVARCHAR(50),
    @name NVARCHAR(200),
    @category NVARCHAR(100) = NULL,
    @unit NVARCHAR(20) = NULL,
    @specification NVARCHAR(500) = NULL,
    @supplierId INT = NULL,
    @price DECIMAL(18,2) = 0,
    @minOrderQuantity DECIMAL(18,4) = 0
AS
BEGIN
    INSERT INTO materials (code, name, category, unit, specification, supplier_id, price, min_order_quantity)
    VALUES (@code, @name, @category, @unit, @specification, @supplierId, @price, @minOrderQuantity);
    
    SELECT SCOPE_IDENTITY() as id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_UpdateMaterial') AND type in (N'P'))
    DROP PROCEDURE sp_UpdateMaterial
GO

CREATE PROCEDURE sp_UpdateMaterial
    @id INT,
    @name NVARCHAR(200),
    @category NVARCHAR(100),
    @unit NVARCHAR(20),
    @specification NVARCHAR(500),
    @supplierId INT,
    @price DECIMAL(18,2),
    @minOrderQuantity DECIMAL(18,4),
    @status INT
AS
BEGIN
    UPDATE materials SET
        name = @name,
        category = @category,
        unit = @unit,
        specification = @specification,
        supplier_id = @supplierId,
        price = @price,
        min_order_quantity = @minOrderQuantity,
        status = @status,
        updated_at = GETDATE()
    WHERE id = @id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_DeleteMaterial') AND type in (N'P'))
    DROP PROCEDURE sp_DeleteMaterial
GO

CREATE PROCEDURE sp_DeleteMaterial
    @id INT
AS
BEGIN
    DELETE FROM materials WHERE id = @id;
END
GO

-- =====================================================
-- 项目存储过程
-- =====================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_InsertProject') AND type in (N'P'))
    DROP PROCEDURE sp_InsertProject
GO

CREATE PROCEDURE sp_InsertProject
    @projectNo NVARCHAR(50),
    @name NVARCHAR(200),
    @customerId INT = NULL,
    @contractId INT = NULL,
    @projectType NVARCHAR(50) = NULL,
    @status NVARCHAR(20) = 'initiating',
    @startDate DATE = NULL,
    @endDate DATE = NULL,
    @budget DECIMAL(18,2) = 0,
    @managerId INT = NULL,
    @description NVARCHAR(2000) = NULL,
    @createdBy INT = NULL
AS
BEGIN
    INSERT INTO projects (project_no, name, customer_id, contract_id, project_type, status, start_date, end_date, budget, manager_id, description, created_by)
    VALUES (@projectNo, @name, @customerId, @contractId, @projectType, @status, @startDate, @endDate, @budget, @managerId, @description, @createdBy);
    
    SELECT SCOPE_IDENTITY() as id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_UpdateProject') AND type in (N'P'))
    DROP PROCEDURE sp_UpdateProject
GO

CREATE PROCEDURE sp_UpdateProject
    @id INT,
    @name NVARCHAR(200),
    @customerId INT,
    @contractId INT,
    @projectType NVARCHAR(50),
    @status NVARCHAR(20),
    @startDate DATE,
    @endDate DATE,
    @actualEndDate DATE = NULL,
    @budget DECIMAL(18,2),
    @managerId INT,
    @description NVARCHAR(2000)
AS
BEGIN
    UPDATE projects SET
        name = @name,
        customer_id = @customerId,
        contract_id = @contractId,
        project_type = @projectType,
        status = @status,
        start_date = @startDate,
        end_date = @endDate,
        actual_end_date = @actualEndDate,
        budget = @budget,
        manager_id = @managerId,
        description = @description,
        updated_at = GETDATE()
    WHERE id = @id;
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_DeleteProject') AND type in (N'P'))
    DROP PROCEDURE sp_DeleteProject
GO

CREATE PROCEDURE sp_DeleteProject
    @id INT
AS
BEGIN
    DELETE FROM projects WHERE id = @id;
END
GO

PRINT '存储过程创建完成！';
