const { getPool } = require('../config/database');

async function checkDeptCodes() {
  const pool = await getPool();
  
  const result = await pool.request().query(`
    SELECT id, name, department_code 
    FROM sys_departments 
    ORDER BY department_code
  `);
  
  console.log('Department codes:');
  result.recordset.forEach(r => {
    console.log(`  - ${r.department_code}: ${r.name} (ID: ${r.id})`);
  });
  
  process.exit(0);
}

checkDeptCodes();
