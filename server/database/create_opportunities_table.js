const { getPool } = require('../config/database');
const sql = require('mssql');

async function createOpportunitiesTable() {
  try {
    const pool = await getPool();

    // 检查表是否存在
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('customer_opportunities', 'U') as tableId
    `);

    if (tableCheck.recordset[0].tableId) {
      console.log('customer_opportunities表已存在，跳过创建');
      return;
    }

    // 创建表
    await pool.request().query(`
      CREATE TABLE customer_opportunities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        opportunity_code NVARCHAR(50) NOT NULL,
        name NVARCHAR(200) NOT NULL,
        customer_id INT NOT NULL,
        sales_id INT,
        contact_person NVARCHAR(100),
        contact_phone NVARCHAR(50),
        contact_email NVARCHAR(100),
        stage NVARCHAR(50) DEFAULT 'initial_contact',
        stage_name NVARCHAR(100),
        equipment_requirements NVARCHAR(MAX),
        production_capacity NVARCHAR(200),
        budget_amount DECIMAL(18,2),
        delivery_cycle INT,
        expected_signing_date DATE,
        competitor_info NVARCHAR(MAX),
        competitor_advantage NVARCHAR(MAX),
        competitor_disadvantage NVARCHAR(MAX),
        lost_reason NVARCHAR(MAX),
        lost_competitor NVARCHAR(200),
        proposal_document NVARCHAR(500),
        technical_agreement NVARCHAR(500),
        contract_document NVARCHAR(500),
        remarks NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'active',
        priority NVARCHAR(50) DEFAULT 'normal',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT
      )
    `);

    // 创建索引
    await pool.request().query(`
      CREATE INDEX idx_opportunity_customer ON customer_opportunities(customer_id);
      CREATE INDEX idx_opportunity_sales ON customer_opportunities(sales_id);
      CREATE INDEX idx_opportunity_stage ON customer_opportunities(stage);
      CREATE INDEX idx_opportunity_status ON customer_opportunities(status);
    `);

    console.log('customer_opportunities表创建成功');
  } catch (error) {
    console.error('创建商机表失败:', error);
    throw error;
  }
}

if (require.main === module) {
  createOpportunitiesTable()
    .then(() => {
      console.log('商机表初始化完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('初始化失败:', err);
      process.exit(1);
    });
}

module.exports = { createOpportunitiesTable };
