const { getPool } = require('../config/database');

async function addTeamIdToUsers() {
  const pool = await getPool();

  try {
    console.log('Adding team_id to sys_users...');

    // Check if team_id column exists
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sys_users'
    `);
    const hasTeamId = columns.recordset.some(c => c.COLUMN_NAME === 'team_id');

    if (hasTeamId) {
      console.log('team_id column already exists');
    } else {
      // Add team_id column
      await pool.request().query(`
        ALTER TABLE [dbo].[sys_users] ADD [team_id] INT NULL
      `);
      console.log('team_id column added');

      // Add foreign key constraint
      try {
        await pool.request().query(`
          ALTER TABLE [dbo].[sys_users] ADD CONSTRAINT [FK_sys_users_team] FOREIGN KEY ([team_id]) REFERENCES [dbo].[sys_teams] ([id]) ON SET NULL ON UPDATE CASCADE
        `);
        console.log('Foreign key constraint added');
      } catch (fkError) {
        console.log('Foreign key constraint may already exist or sys_teams table does not exist:', fkError.message);
      }
    }

    // Verify
    const verifyColumns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sys_users'
    `);
    console.log('Current sys_users columns:', verifyColumns.recordset.map(c => c.COLUMN_NAME));

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTeamIdToUsers();
