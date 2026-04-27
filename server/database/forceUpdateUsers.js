const db = require('../config/database');
const sql = db.sql;
const fs = require('fs');
const path = require('path');

async function forceUpdateUsers() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池');

    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'force_update_users.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('正在执行强制更新...');
    
    // 执行 SQL 脚本
    const result = await pool.request().query(sqlQuery);
    
    console.log('\n✅ 强制更新完成！');
    console.log('更新的用户列表：');
    console.table(result.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

// 运行更新
forceUpdateUsers();
