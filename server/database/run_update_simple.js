const db = require('../config/database');
const sql = db.sql;
const fs = require('fs');
const path = require('path');

async function updateOrgStructure() {
  try {
    console.log('=== 开始更新组织架构数据 ===\n');
    
    // 获取共享数据库连接
    const pool = await db.getPool();
    console.log('✅ 已连接到共享数据库池\n');
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'update_org_simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割 SQL 语句（按 GO 分隔）
    const statements = sqlContent.split(/^GO\s*$/im);
    
    // 执行每个 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        try {
          const result = await pool.request().query(statement);
          
          // 如果有结果集，显示查询结果
          if (result.recordset && result.recordset.length > 0) {
            console.log('\n查询结果:');
            console.table(result.recordset);
          }
        } catch (err) {
          // 忽略 PRINT 语句的错误
          if (!err.message.includes('PRINT')) {
            console.error(`语句 ${i + 1} 执行失败:`, err.message);
          }
        }
      }
    }
    
    console.log('\n✅ 组织架构更新完成！');
    
    await db.closePool();
    console.log('\n✅ 所有操作完成！（已释放共享连接）');
    process.exit(0);
  } catch (err) {
    console.error('❌ 更新失败:', err);
    process.exit(1);
  }
}

updateOrgStructure();
