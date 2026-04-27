const { getPool } = require('./config/database');
const sql = require('mssql');

async function testTeamCountAPI() {
  try {
    // Test 1: Direct database update
    console.log('Test 1: Direct database update');
    const pool = await getPool();

    // Update team count directly
    await pool.request()
      .input('id', sql.Int, 1)
      .input('current_staff', sql.Int, 2)
      .query(`
        UPDATE sys_teams
        SET current_staff = @current_staff,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    console.log('Direct update successful');

    // Verify
    const result = await pool.request()
      .input('id', sql.Int, 1)
      .query('SELECT * FROM sys_teams WHERE id = @id');

    console.log('Team after update:', result.recordset[0]);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTeamCountAPI();
