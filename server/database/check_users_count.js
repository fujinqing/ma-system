const { getPool } = require('../config/database');

async function checkUsersCount() {
  const pool = await getPool();
  
  const result = await pool.request().query('SELECT COUNT(*) as count FROM sys_users WHERE status = \'active\'');
  console.log('Active users count:', result.recordset[0].count);
  
  const allUsers = await pool.request().query('SELECT id, name, position, department_id, team_id FROM sys_users WHERE status = \'active\' ORDER BY id');
  console.log('\nAll active users:');
  allUsers.recordset.forEach(u => {
    console.log(`  - ${u.name}: ${u.position} (dept: ${u.department_id}, team: ${u.team_id})`);
  });
  
  process.exit(0);
}

checkUsersCount();
