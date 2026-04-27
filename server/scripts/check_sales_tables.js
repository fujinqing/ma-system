const db = require('../config/database');

(async () => {
  try {
    const pool = await db.getPool();
    const q = `
      SELECT name FROM sys.tables
      WHERE name LIKE '%price%'
         OR name LIKE '%quotation%'
         OR name LIKE '%contract%'
         OR name LIKE '%payment%'
         OR name LIKE '%bidding%'
         OR name LIKE '%quotation%'
         OR name LIKE '%calculation%'
    `;

    const result = await pool.request().query(q);
    console.log('匹配到的表：', result.recordset);

    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }
})();
