/**
 * 客户池功能数据库更新脚本
 * 添加公海/私海客户支持
 */

const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateCustomerPool() {
  try {
    const pool = await getPool();
    console.log('开始更新客户表结构，添加客户池功能...');

    // 检查 customers 表是否有 customer_pool_type 字段
    const columnCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_pool_type'`);

    if (columnCheck.recordset[0].count === 0) {
      console.log('添加 customer_pool_type 字段到 customers 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[customers] ADD [customer_pool_type] NVARCHAR(20) DEFAULT 'public'
      `);
      console.log('customer_pool_type 字段添加成功');
      
      // 更新现有数据，有 sales_id 的为私海客户，否则为公海客户
      await pool.request().query(`
        UPDATE [dbo].[customers] 
        SET [customer_pool_type] = CASE 
          WHEN [sales_id] IS NOT NULL THEN 'private' 
          ELSE 'public' 
        END
      `);
      console.log('现有数据已更新');
    } else {
      console.log('customer_pool_type 字段已存在');
    }

    // 检查 customers 表是否有 assigned_by 字段（记录分配人）
    const assignedByCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'assigned_by'`);

    if (assignedByCheck.recordset[0].count === 0) {
      console.log('添加 assigned_by 字段到 customers 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[customers] ADD [assigned_by] INT NULL
      `);
      console.log('assigned_by 字段添加成功');
    } else {
      console.log('assigned_by 字段已存在');
    }

    // 检查 customers 表是否有 assigned_at 字段（记录分配时间）
    const assignedAtCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'assigned_at'`);

    if (assignedAtCheck.recordset[0].count === 0) {
      console.log('添加 assigned_at 字段到 customers 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[customers] ADD [assigned_at] DATETIME NULL
      `);
      console.log('assigned_at 字段添加成功');
    } else {
      console.log('assigned_at 字段已存在');
    }

    // 检查 customers 表是否有 claimed_by 字段（记录领取人）
    const claimedByCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'claimed_by'`);

    if (claimedByCheck.recordset[0].count === 0) {
      console.log('添加 claimed_by 字段到 customers 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[customers] ADD [claimed_by] INT NULL
      `);
      console.log('claimed_by 字段添加成功');
    } else {
      console.log('claimed_by 字段已存在');
    }

    // 检查 customers 表是否有 claimed_at 字段（记录领取时间）
    const claimedAtCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'claimed_at'`);

    if (claimedAtCheck.recordset[0].count === 0) {
      console.log('添加 claimed_at 字段到 customers 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[customers] ADD [claimed_at] DATETIME NULL
      `);
      console.log('claimed_at 字段添加成功');
    } else {
      console.log('claimed_at 字段已存在');
    }

    // 创建客户池操作日志表
    const tableCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_NAME = 'customer_pool_logs'`);

    if (tableCheck.recordset[0].count === 0) {
      console.log('创建 customer_pool_logs 表...');
      await pool.request().query(`
        CREATE TABLE [dbo].[customer_pool_logs] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [customer_id] INT NOT NULL,
          [action_type] NVARCHAR(50) NOT NULL, -- 'claim', 'assign', 'release', 'transfer'
          [from_sales_id] INT NULL,
          [to_sales_id] INT NULL,
          [from_pool_type] NVARCHAR(20) NULL,
          [to_pool_type] NVARCHAR(20) NULL,
          [operator_id] INT NOT NULL,
          [remarks] NVARCHAR(500) NULL,
          [created_at] DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('customer_pool_logs 表创建成功');
    } else {
      console.log('customer_pool_logs 表已存在');
    }

    console.log('客户池功能数据库更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('更新客户池数据库失败:', error);
    process.exit(1);
  }
}

updateCustomerPool();
