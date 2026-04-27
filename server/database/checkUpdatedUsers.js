const db = require('../config/database');
const sql = db.sql;

async function checkUpdatedUsers() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 检查特定工号的用户数据
    const employeeNos = [1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
    
    console.log('=== 检查已更新的用户数据 ===\n');
    
    for (const empNo of employeeNos) {
      const result = await pool.request()
        .input('employee_no', sql.Int, empNo)
        .query(`
          SELECT 
            employee_no,
            name,
            gender,
            join_date,
            position,
            email
          FROM sys_users
          WHERE employee_no = @employee_no AND status = 'active'
        `);
      
      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        console.log(`工号 ${empNo}: ${user.name}`);
        console.log(`  性别：${user.gender || 'null'}`);
        console.log(`  入职时间：${user.join_date || 'null'}`);
        console.log(`  职位：${user.position || 'null'}`);
        console.log(`  邮箱：${user.email || 'null'}`);
        console.log('');
      } else {
        console.log(`工号 ${empNo}: 未找到用户`);
        console.log('');
      }
    }

    await db.closePool();
    console.log('数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkUpdatedUsers();
