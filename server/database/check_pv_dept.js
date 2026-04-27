const { getPool } = require('../config/database');

async function checkPVDept() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT id, name, color FROM sys_departments WHERE name LIKE '%光伏%'");
  console.log('光伏半导体事业部:', JSON.stringify(result.recordset, null, 2));
  process.exit(0);
}

checkPVDept();
