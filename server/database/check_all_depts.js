const { getPool } = require('../config/database');

async function checkAllDepts() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT id, name, color FROM sys_departments");
  console.log('所有部门:', JSON.stringify(result.recordset, null, 2));
  process.exit(0);
}

checkAllDepts();
