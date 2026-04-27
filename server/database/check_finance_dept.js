const { getPool } = require('../config/database');

async function checkDept() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT id, name, color FROM sys_departments WHERE name LIKE '%财务%'");
  console.log('财务&商务部:', JSON.stringify(result.recordset, null, 2));
  process.exit(0);
}

checkDept();
