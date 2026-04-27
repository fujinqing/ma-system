const db = require('../config/database');
const sql = db.sql;
const fs = require('fs');
const path = require('path');

async function runInitScript() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 1. 先执行部门表创建脚本
    console.log('=== 步骤 1: 创建部门表 ===');
    const deptSqlPath = path.join(__dirname, 'init_departments.sql');
    const deptSqlContent = fs.readFileSync(deptSqlPath, 'utf8');
    
    // 分割 SQL 语句（按 GO 分割）
    const deptStatements = deptSqlContent.split('GO').filter(s => s.trim());
    
    for (const statement of deptStatements) {
      if (statement.trim() && !statement.trim().startsWith('PRINT')) {
        try {
          await pool.request().query(statement);
          console.log('✓ 执行成功');
        } catch (err) {
          if (err.message.includes('已存在') || err.message.includes('already exists')) {
            console.log('○ 已跳过 (已存在)');
          } else {
            console.error('✗ 执行出错:', err.message.substring(0, 100));
          }
        }
      }
    }
    
    // 2. 执行用户表创建脚本
    console.log('\n=== 步骤 2: 创建用户表 ===');
    const userSqlPath = path.join(__dirname, 'init_users.sql');
    const userSqlContent = fs.readFileSync(userSqlPath, 'utf8');
    
    const userStatements = userSqlContent.split('GO').filter(s => s.trim());
    
    for (const statement of userStatements) {
      if (statement.trim() && !statement.trim().startsWith('PRINT')) {
        try {
          await pool.request().query(statement);
          console.log('✓ 执行成功');
        } catch (err) {
          if (err.message.includes('已存在') || err.message.includes('already exists')) {
            console.log('○ 已跳过 (已存在)');
          } else {
            console.error('✗ 执行出错:', err.message.substring(0, 100));
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    
    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

runInitScript();
