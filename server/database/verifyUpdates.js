const sql = require('mssql');

// 数据库配置
const config = {
  user: 'sa',
  password: process.env.DB_PASSWORD || 'M-A_SYSTEM_2026',
  server: process.env.DB_SERVER || 'localhost',
  database: 'M-A_OP_ODB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function verifyUpdates() {
  try {
    console.log('正在连接数据库...');
    const pool = await sql.connect(config);
    console.log('数据库连接成功！\n');

    // 验证更新结果
    console.log('=== 验证更新结果 ===');
    const verifyResult = await pool.request().query(`
      SELECT TOP 20
        id,
        employee_no AS '工号',
        name AS '姓名',
        gender AS '性别',
        join_date AS '入职时间',
        position AS '职位'
      FROM sys_users
      WHERE employee_no IS NOT NULL AND status = 'active'
      ORDER BY employee_no DESC
    `);

    console.log(`\n已分配工号的用户数：${verifyResult.recordset.length}`);
    if (verifyResult.recordset.length > 0) {
      console.table(verifyResult.recordset);
    }

    // 检查工号范围
    const minMaxResult = await pool.request().query(`
      SELECT 
        MIN(employee_no) AS min_employee_no,
        MAX(employee_no) AS max_employee_no,
        COUNT(*) AS total
      FROM sys_users
      WHERE employee_no IS NOT NULL AND status = 'active'
    `);

    console.log('\n=== 工号范围统计 ===');
    console.log(`最小工号：${minMaxResult.recordset[0].min_employee_no}`);
    console.log(`最大工号：${minMaxResult.recordset[0].max_employee_no}`);
    console.log(`总用户数：${minMaxResult.recordset[0].total}`);

    await pool.close();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

verifyUpdates();
