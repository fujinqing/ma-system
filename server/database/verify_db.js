const sql = require('mssql');
const config = require('../config/index').database;

async function verifyDatabase() {
  try {
    const pool = await sql.connect(config);
    console.log('数据库连接成功\n');
    
    // 检查部门表
    console.log('=== 检查 sys_departments 表 ===');
    const deptResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys_departments WHERE status = 'active'
    `);
    console.log(`活跃部门数量：${deptResult.recordset[0].count}`);
    
    // 获取所有部门
    const depts = await pool.request().query(`
      SELECT id, department_code, name, manager, headcount, current_staff 
      FROM sys_departments 
      WHERE status = 'active'
      ORDER BY sort_order
    `);
    console.log('\n部门列表:');
    depts.recordset.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.department_code} - ${dept.name} (负责人：dept.manager || '暂无', 编制：${dept.headcount}人，实际：${dept.current_staff}人)`);
    });
    
    // 检查用户表
    console.log('\n=== 检查 sys_users 表 ===');
    const userResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys_users WHERE status = 'active'
    `);
    console.log(`活跃用户数量：${userResult.recordset[0].count}`);
    
    // 获取每个部门的用户数
    const deptUsers = await pool.request().query(`
      SELECT d.name as dept_name, COUNT(u.id) as user_count
      FROM sys_departments d
      LEFT JOIN sys_users u ON d.id = u.department_id AND u.status = 'active'
      WHERE d.status = 'active'
      GROUP BY d.id, d.name, d.sort_order
      ORDER BY d.sort_order
    `);
    console.log('\n各部门用户分布:');
    deptUsers.recordset.forEach(dept => {
      console.log(`  ${dept.dept_name}: ${dept.user_count}人`);
    });
    
    console.log('\n✅ 数据库验证完成！');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ 验证失败:', err);
    process.exit(1);
  }
}

verifyDatabase();
