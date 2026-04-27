const db = require('../config/database');
const sql = db.sql;

async function testUserAPI() {
  try {
    const pool = await db.getPool();
    console.log('=== 测试用户数据 ===\n');
    
    // 查询所有用户及其部门
    const result = await pool.request().query(`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.role,
        u.department_id,
        d.name as department_name,
        u.position,
        u.phone,
        u.email,
        u.status
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE u.status = 'active'
      ORDER BY u.department_id, u.id
    `);
    
    console.log(`总用户数：${result.recordset.length}\n`);
    
    // 按部门分组显示
    const usersByDept = {};
    result.recordset.forEach(user => {
      const deptName = user.department_name || '无部门';
      if (!usersByDept[deptName]) {
        usersByDept[deptName] = [];
      }
      usersByDept[deptName].push(user);
    });
    
    // 显示每个部门的用户
    Object.keys(usersByDept).forEach((deptName, index) => {
      console.log(`${index + 1}. ${deptName} (${usersByDept[deptName].length}人)`);
      usersByDept[deptName].forEach(user => {
        console.log(`   - ${user.name} (${user.position}) - ${user.username}`);
      });
      console.log('');
    });
    
    console.log('✅ 测试完成！');
    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('❌ 测试失败:', err);
    process.exit(1);
  }
}

testUserAPI();
