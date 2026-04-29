const { getPool } = require('../config/database');

async function createTransferTables() {
  try {
    const pool = await getPool();

    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('customer_transfer_logs', 'U') as tableId
    `);

    if (!tableCheck.recordset[0].tableId) {
      await pool.request().query(`
        CREATE TABLE customer_transfer_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          customer_id INT NOT NULL,
          from_user_id INT,
          to_user_id INT NOT NULL,
          transfer_type NVARCHAR(50) NOT NULL,
          transfer_reason NVARCHAR(500),
          transfer_remark NVARCHAR(MAX),
          status NVARCHAR(50) DEFAULT 'completed',
          created_at DATETIME DEFAULT GETDATE(),
          created_by INT
        )
      `);
      await pool.request().query(`
        CREATE INDEX idx_transfer_customer ON customer_transfer_logs(customer_id);
        CREATE INDEX idx_transfer_from_user ON customer_transfer_logs(from_user_id);
        CREATE INDEX idx_transfer_to_user ON customer_transfer_logs(to_user_id);
      `);
      console.log('customer_transfer_logs表创建成功');
    } else {
      console.log('customer_transfer_logs表已存在');
    }

    const permCheck = await pool.request().query(`
      SELECT OBJECT_ID('customer_data_permissions', 'U') as tableId
    `);

    if (!permCheck.recordset[0].tableId) {
      await pool.request().query(`
        CREATE TABLE customer_data_permissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          permission_level NVARCHAR(50) NOT NULL,
          department_id INT,
          allowed_customer_ids NVARCHAR(MAX),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);
      await pool.request().query(`
        CREATE INDEX idx_permission_user ON customer_data_permissions(user_id);
      `);
      console.log('customer_data_permissions表创建成功');
    } else {
      console.log('customer_data_permissions表已存在');
    }

  } catch (error) {
    console.error('创建客户移交表失败:', error);
    throw error;
  }
}

if (require.main === module) {
  createTransferTables()
    .then(() => {
      console.log('客户移交表初始化完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('初始化失败:', err);
      process.exit(1);
    });
}

module.exports = { createTransferTables };
