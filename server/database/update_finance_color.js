const { getPool } = require('../config/database');

async function updateFinanceColor() {
  const pool = await getPool();

  // 更新财务&商务部的颜色
  await pool.request()
    .input('color', '#52c41a')
    .query("UPDATE sys_departments SET color = @color WHERE name LIKE '%财务%'");

  // 验证更新
  const result = await pool.request().query("SELECT id, name, color FROM sys_departments WHERE name LIKE '%财务%'");
  console.log('更新后:', JSON.stringify(result.recordset, null, 2));
  process.exit(0);
}

updateFinanceColor();
