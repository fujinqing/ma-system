const db = require('../config/database');
const sql = db.sql;
const fs = require('fs');
const path = require('path');

async function createPositionsTable() {
  try {
    console.log('=== 创建职位管理表 ===\n');
    
    const pool = await db.getPool();
    
    // 读取并执行 SQL 文件
    const sqlPath = path.join(__dirname, 'create_positions_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 执行 SQL 脚本
    await pool.request().query(sqlContent);
    
    console.log('\n✅ 职位管理表创建完成！');
    
    await db.closePool();
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}

createPositionsTable();
