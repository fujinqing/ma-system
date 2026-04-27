const { getPool } = require('../config/database');

async function checkConstraints() {
  const pool = await getPool();
  
  // 检查部门表的唯一约束
  const result = await pool.request().query(`
    SELECT 
      tc.CONSTRAINT_NAME,
      tc.CONSTRAINT_TYPE,
      kcu.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    WHERE tc.TABLE_NAME = 'sys_departments'
    AND tc.CONSTRAINT_TYPE = 'UNIQUE'
  `);
  
  console.log('Unique constraints on sys_departments:');
  result.recordset.forEach(r => {
    console.log(`  - ${r.CONSTRAINT_NAME}: ${r.COLUMN_NAME}`);
  });
  
  // 检查部门编码重复
  const dupResult = await pool.request().query(`
    SELECT department_code, COUNT(*) as count
    FROM sys_departments
    GROUP BY department_code
    HAVING COUNT(*) > 1
  `);
  
  console.log('\nDuplicate department codes:');
  dupResult.recordset.forEach(r => {
    console.log(`  - ${r.department_code}: ${r.count} times`);
  });
  
  process.exit(0);
}

checkConstraints();
