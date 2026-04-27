const { getPool } = require('../config/database');

async function checkTeamsTable() {
  const pool = await getPool();

  try {
    console.log('Checking sys_teams table...');

    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_teams]') AND type in (N'U')
    `);

    if (tableCheck.recordset.length === 0) {
      console.log('ERROR: sys_teams table does not exist!');
      process.exit(1);
    } else {
      console.log('sys_teams table exists');
    }

    // Get table columns
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sys_teams'
    `);
    console.log('sys_teams columns:', columns.recordset.map(c => c.COLUMN_NAME));

    // Check if parent_team_id column exists
    const hasParentTeamId = columns.recordset.some(c => c.COLUMN_NAME === 'parent_team_id');
    console.log('Has parent_team_id:', hasParentTeamId);

    // Get current data
    const result = await pool.request().query('SELECT * FROM sys_teams');
    console.log('Current teams:', result.recordset);

    console.log('Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeamsTable();
