const db = require('../config/database');
const sql = db.sql;
const fs = require('fs');
const path = require('path');

async function alterUsersTable() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池');

    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'alter_users_table.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('正在执行表结构修改...');
    
    // 执行 SQL 脚本
    await pool.request().query(sqlQuery);
    
    console.log('\n✅ 表结构修改完成！');

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 修改失败:', error);
    process.exit(1);
  }
}

// 运行更新
alterUsersTable();
