const db = require('../config/database');
const sql = db.sql;

async function testAPI() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 模拟 userController.js 中的查询
    const result = await pool.request()
      .query(`
        SELECT TOP 5 u.*, d.name as department_name, t.name as team_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.status = 'active' AND u.employee_no IS NOT NULL
        ORDER BY u.employee_no
      `);
    
    console.log('=== 用户数据字段检查 ===\n');
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('第一个用户的字段:');
      console.log('employee_no:', user.employee_no);
      console.log('name:', user.name);
      console.log('gender:', user.gender);
      console.log('join_date:', user.join_date);
      console.log('position:', user.position);
      console.log('email:', user.email);
      console.log('\n完整字段列表:');
      console.log(Object.keys(user));
    }

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testAPI();
