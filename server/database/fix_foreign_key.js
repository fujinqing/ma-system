const { getPool } = require('../config/database');

async function fixForeignKey() {
  const pool = await getPool();

  try {
    console.log('Fixing foreign key constraint...');

    // Check if foreign key exists
    const fkCheck = await pool.request().query(`
      SELECT * FROM sys.foreign_keys WHERE name = 'FK_sys_users_team'
    `);

    if (fkCheck.recordset.length > 0) {
      console.log('Foreign key FK_sys_users_team already exists');
    } else {
      // Check if sys_teams table exists
      const tableCheck = await pool.request().query(`
        SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sys_teams]') AND type in (N'U')
      `);

      if (tableCheck.recordset.length === 0) {
        console.log('ERROR: sys_teams table does not exist!');
        process.exit(1);
      }

      // Add foreign key constraint with correct syntax for SQL Server
      try {
        await pool.request().query(`
          ALTER TABLE [dbo].[sys_users] ADD CONSTRAINT [FK_sys_users_team] 
          FOREIGN KEY ([team_id]) REFERENCES [dbo].[sys_teams] ([id]) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('Foreign key constraint added successfully');
      } catch (fkError) {
        console.log('Error adding foreign key:', fkError.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixForeignKey();
