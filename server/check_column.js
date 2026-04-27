const { getPool } = require('./config/database');

async function checkColumn() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_pool_type'
    `);
    console.log('customer_pool_type 字段是否存在:', result.recordset.length > 0);
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkColumn();
