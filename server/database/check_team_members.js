const { getPool } = require('../config/database');

async function checkTeamMembers() {
  const pool = await getPool();

  try {
    console.log('Checking team members...');

    // Get all teams
    const teams = await pool.request().query(`
      SELECT id, name, department_id, current_staff FROM sys_teams
    `);
    console.log('Teams:', teams.recordset);

    // Get users with team assignment
    const users = await pool.request().query(`
      SELECT u.id, u.name, u.department_id, u.team_id, t.name as team_name
      FROM sys_users u
      LEFT JOIN sys_teams t ON u.team_id = t.id
      WHERE u.status = 'active'
      ORDER BY u.team_id, u.department_id
    `);
    console.log('Users with team:', users.recordset);

    // Check if there are any users with team_id
    const usersWithTeam = users.recordset.filter(u => u.team_id !== null);
    console.log('Users assigned to teams:', usersWithTeam);

    console.log('Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeamMembers();
