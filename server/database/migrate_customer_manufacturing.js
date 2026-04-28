const sql = require('mssql');
const { getPool } = require('../config/database');

async function migrate() {
  try {
    console.log('开始迁移客户表，增加制造业专属字段...');
    const pool = await getPool();

    const newColumns = [
      { name: 'enterprise_category', type: 'NVARCHAR(50)', default: null },
      { name: 'equipment_type', type: 'NVARCHAR(50)', default: null },
      { name: 'annual_purchase_amount', type: 'DECIMAL(18,2)', default: null },
      { name: 'cooperation_level', type: 'NVARCHAR(50)', default: null },
      { name: 'region', type: 'NVARCHAR(100)', default: null },
      { name: 'main_equipment', type: 'NVARCHAR(500)', default: null }
    ];

    for (const col of newColumns) {
      try {
        const checkResult = await pool.request()
          .query(`SELECT TOP 1 * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = '${col.name}'`);

        if (checkResult.recordset.length === 0) {
          console.log(`添加字段: ${col.name}`);
          await pool.request()
            .query(`ALTER TABLE customers ADD ${col.name} ${col.type} NULL`);
          console.log(`字段 ${col.name} 添加成功`);
        } else {
          console.log(`字段 ${col.name} 已存在，跳过`);
        }
      } catch (err) {
        console.error(`添加字段 ${col.name} 失败:`, err.message);
      }
    }

    console.log('迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrate();
