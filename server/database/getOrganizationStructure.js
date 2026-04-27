const db = require('../config/database');
const sql = db.sql;

async function getOrganizationStructure() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 获取所有部门
    console.log('=== 部门列表 ===');
    const depts = await pool.request().query(`
      SELECT id, name, sort_order, status
      FROM sys_departments
      WHERE status = 'active'
      ORDER BY sort_order, id
    `);

    console.table(depts.recordset);

    // 获取所有小组
    console.log('\n=== 小组列表 ===');
    const teams = await pool.request().query(`
      SELECT t.id, t.name, t.department_id, d.name as department_name
      FROM sys_teams t
      LEFT JOIN sys_departments d ON t.department_id = d.id
      WHERE t.status = 'active'
      ORDER BY t.department_id, t.id
    `);

    console.table(teams.recordset);

    // 获取每个部门的用户数
    console.log('\n=== 各部门用户数 ===');
    const userCounts = await pool.request().query(`
      SELECT 
        d.name as department_name,
        COUNT(u.id) as user_count
      FROM sys_departments d
      LEFT JOIN sys_users u ON u.department_id = d.id AND u.status = 'active'
      WHERE d.status = 'active'
      GROUP BY d.name
      ORDER BY d.sort_order
    `);

    console.table(userCounts.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

getOrganizationStructure();
