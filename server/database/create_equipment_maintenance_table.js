const { getPool } = require('../config/database');

async function createEquipmentTables() {
  try {
    const pool = await getPool();

    const tables = [
      {
        name: 'customer_equipment',
        createSQL: `
          CREATE TABLE customer_equipment (
            id INT IDENTITY(1,1) PRIMARY KEY,
            equipment_code NVARCHAR(100) NOT NULL,
            equipment_name NVARCHAR(200) NOT NULL,
            customer_id INT NOT NULL,
            equipment_model NVARCHAR(200),
            equipment_specs NVARCHAR(500),
            serial_number NVARCHAR(200),
            manufacture_date DATE,
            installation_date DATE,
            warranty_expire_date DATE,
            equipment_status NVARCHAR(50) DEFAULT 'normal',
            equipment_location NVARCHAR(500),
            production_line NVARCHAR(200),
            photo_urls NVARCHAR(MAX),
            remarks NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE(),
            created_by INT,
            updated_by INT
          )
        `,
        indexes: `
          CREATE INDEX idx_equipment_customer ON customer_equipment(customer_id);
          CREATE INDEX idx_equipment_code ON customer_equipment(equipment_code);
          CREATE INDEX idx_equipment_status ON customer_equipment(equipment_status);
        `
      },
      {
        name: 'equipment_maintenance_records',
        createSQL: `
          CREATE TABLE equipment_maintenance_records (
            id INT IDENTITY(1,1) PRIMARY KEY,
            equipment_id INT NOT NULL,
            maintenance_type NVARCHAR(50) NOT NULL,
            maintenance_date DATETIME NOT NULL,
            engineer_id INT,
            maintenance_content NVARCHAR(MAX),
            parts_replaced NVARCHAR(MAX),
            maintenance_hours DECIMAL(10,2),
            cost DECIMAL(18,2),
            next_maintenance_date DATE,
            customer_feedback NVARCHAR(500),
            report_urls NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE(),
            created_by INT
          )
        `,
        indexes: `
          CREATE INDEX idx_maintenance_equipment ON equipment_maintenance_records(equipment_id);
          CREATE INDEX idx_maintenance_date ON equipment_maintenance_records(maintenance_date);
        `
      },
      {
        name: 'equipment_repair_requests',
        createSQL: `
          CREATE TABLE equipment_repair_requests (
            id INT IDENTITY(1,1) PRIMARY KEY,
            equipment_id INT NOT NULL,
            request_no NVARCHAR(50) NOT NULL,
            reporter_name NVARCHAR(100),
            reporter_phone NVARCHAR(50),
            fault_description NVARCHAR(MAX),
            faultPhotos NVARCHAR(MAX),
            request_date DATETIME DEFAULT GETDATE(),
            priority NVARCHAR(50) DEFAULT 'normal',
            status NVARCHAR(50) DEFAULT 'pending',
            assigned_engineer_id INT,
            assigned_date DATETIME,
            completed_date DATETIME,
            evaluation NVARCHAR(500),
            created_at DATETIME DEFAULT GETDATE()
          )
        `,
        indexes: `
          CREATE INDEX idx_repair_equipment ON equipment_repair_requests(equipment_id);
          CREATE INDEX idx_repair_status ON equipment_repair_requests(status);
          CREATE INDEX idx_repair_request_no ON equipment_repair_requests(request_no);
        `
      },
      {
        name: 'maintenance_plans',
        createSQL: `
          CREATE TABLE maintenance_plans (
            id INT IDENTITY(1,1) PRIMARY KEY,
            equipment_id INT NOT NULL,
            plan_no NVARCHAR(50) NOT NULL,
            plan_type NVARCHAR(50),
            plan_content NVARCHAR(MAX),
            plan_date DATE,
            engineer_id INT,
            status NVARCHAR(50) DEFAULT 'pending',
            completed_date DATETIME,
            remarks NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
          )
        `,
        indexes: `
          CREATE INDEX idx_plan_equipment ON maintenance_plans(equipment_id);
          CREATE INDEX idx_plan_status ON maintenance_plans(status);
          CREATE INDEX idx_plan_date ON maintenance_plans(plan_date);
        `
      }
    ];

    for (const table of tables) {
      const tableCheck = await pool.request().query(`
        SELECT OBJECT_ID('${table.name}', 'U') as tableId
      `);

      if (!tableCheck.recordset[0].tableId) {
        await pool.request().query(table.createSQL);
        if (table.indexes) {
          await pool.request().query(table.indexes);
        }
        console.log(`${table.name}表创建成功`);
      } else {
        console.log(`${table.name}表已存在`);
      }
    }

    console.log('设备维保相关表初始化完成');
  } catch (error) {
    console.error('创建设备维保表失败:', error);
    throw error;
  }
}

if (require.main === module) {
  createEquipmentTables()
    .then(() => {
      console.log('设备维保表初始化完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('初始化失败:', err);
      process.exit(1);
    });
}

module.exports = { createEquipmentTables };
