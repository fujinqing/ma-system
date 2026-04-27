const db = require('../config/database');
const sql = db.sql;

// 要检查的工号
const employeeNos = [61, 62, 66, 68, 70, 74, 76, 77, 79, 82, 83, 84, 85, 87, 88, 89, 90, 96, 97, 98, 101, 102, 103, 107, 80, 113, 114, 122, 124, 126, 127, 129, 133, 41, 134, 135, 137, 138, 139, 140, 141];

async function checkUsers() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    console.log('=== 检查用户是否存在 ===\n');
    
    // 构建工号列表
    const employeeNoList = employeeNos.join(',');
    
    const result = await pool.request().query(`
      SELECT 
        employee_no AS '工号',
        name AS '姓名',
        gender AS '性别',
        join_date AS '入职时间',
        position AS '职位',
        status AS '状态'
      FROM sys_users
      WHERE employee_no IN (${employeeNoList})
      ORDER BY employee_no
    `);

    if (result.recordset.length > 0) {
      console.log(`找到 ${result.recordset.length} 个用户：`);
      console.table(result.recordset);
    } else {
      console.log('没有找到任何用户');
    }

    // 检查总用户数
    const totalResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM sys_users WHERE status = 'active'
    `);
    console.log(`\n数据库中活跃用户总数：${totalResult.recordset[0].total}`);

    // 查看一些现有用户的工号范围
    const rangeResult = await pool.request().query(`
      SELECT TOP 10 employee_no, name FROM sys_users WHERE status = 'active' ORDER BY employee_no
    `);
    console.log('\n现有用户工号范围：');
    console.table(rangeResult.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkUsers();
