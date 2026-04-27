const { getPool } = require('../config/database');

async function checkUsersTable() {
  const pool = await getPool();

  try {
    console.log('Checking sys_users table...');

    // Check if team_id column exists
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sys_users'
    `);
    console.log('sys_users columns:', columns.recordset.map(c => c.COLUMN_NAME));

    const hasTeamId = columns.recordset.some(c => c.COLUMN_NAME === 'team_id');
    console.log('Has team_id column:', hasTeamId);

    if (hasTeamId) {
      // Get users with team_id
      const result = await pool.request().query(`
        SELECT u.id, u.name, u.department_id, u.team_id, t.name as team_name
        FROM sys_users u
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.status = 'active'
        ORDER BY u.department_id, u.team_id
      `);
      console.log('Users with team assignment:', result.recordset);
    }

    console.log('Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsersTable();
