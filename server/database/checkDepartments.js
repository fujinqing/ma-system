const db = require('../config/database');
const sql = db.sql;

async function checkDepartments() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 查看所有部门
    console.log('=== 所有部门 ===');
    const depts = await pool.request().query(`
      SELECT id, name, sort_order, status
      FROM sys_departments
      ORDER BY name
    `);

    console.table(depts.recordset);

    // 搜索特定部门
    const searchNames = ['产品', '信息', '测试'];
    console.log('\n=== 搜索结果 ===');
    
    for (const name of searchNames) {
      const result = await pool.request()
        .input('name', sql.NVarChar, `%${name}%`)
        .query(`
          SELECT id, name, sort_order, status
          FROM sys_departments
          WHERE name LIKE @name
        `);
      
      console.log(`包含 "${name}" 的部门:`);
      if (result.recordset.length > 0) {
        console.table(result.recordset);
      } else {
        console.log('  无匹配部门');
      }
    }

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkDepartments();
