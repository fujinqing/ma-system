const db = require('../config/database');
const sql = db.sql;

async function checkUserData() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 检查用户数据完整性
    console.log('=== 检查用户数据完整性 ===\n');
    
    const result = await pool.request().query(`
      SELECT 
        u.employee_no AS '工号',
        u.name AS '姓名',
        CASE WHEN u.gender = 'male' THEN '男' ELSE '女' END AS '性别',
        u.join_date AS '入职时间',
        u.position AS '职位',
        d.name AS '所属部门',
        t.name AS '所属小组',
        u.status AS '状态'
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      LEFT JOIN sys_teams t ON u.team_id = t.id
      WHERE u.status = 'active'
      ORDER BY u.employee_no
    `);

    console.log('在职用户列表：');
    console.table(result.recordset);

    // 统计数据
    console.log('\n=== 统计数据 ===\n');
    const stats = await pool.request().query(`
      SELECT 
        COUNT(*) AS '总人数',
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS '男性人数',
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS '女性人数',
        COUNT(DISTINCT department_id) AS '部门数',
        COUNT(DISTINCT team_id) AS '小组数'
      FROM sys_users
      WHERE status = 'active'
    `);

    console.log(stats.recordset[0]);

    // 检查数据完整性
    console.log('\n=== 数据完整性检查 ===\n');
    
    const missingGender = await pool.request().query(`
      SELECT COUNT(*) AS count FROM sys_users 
      WHERE status = 'active' AND (gender IS NULL OR gender = '')
    `);
    
    const missingJoinDate = await pool.request().query(`
      SELECT COUNT(*) AS count FROM sys_users 
      WHERE status = 'active' AND join_date IS NULL
    `);

    const missingPosition = await pool.request().query(`
      SELECT COUNT(*) AS count FROM sys_users 
      WHERE status = 'active' AND (position IS NULL OR position = '')
    `);

    console.log(`缺少性别的用户数：${missingGender.recordset[0].count}`);
    console.log(`缺少入职时间的用户数：${missingJoinDate.recordset[0].count}`);
    console.log(`缺少职位的用户数：${missingPosition.recordset[0].count}`);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

// 运行检查
checkUserData();
