const sql = require('mssql');
const { getPool } = require('./config/database');

(async () => {
  try {
    const pool = await getPool();

    // 检查 sys_users 表的列
    const result = await pool.request().query('SELECT TOP 1 * FROM sys_users');
    console.log('sys_users columns:', Object.keys(result.recordset[0] || {}).join(', '));

    // 检查表结构
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'sys_users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\nTable structure:');
    columnsResult.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
