const eventBus = require('../eventBus');
const db = require('../../config/database');
const { eventDefinitions } = require('../eventSchema');

const ETL_RULES = {
  customer: {
    targetTable: 'etl_customer_sales',
    mappings: {
      customer_id: 'id',
      customer_name: 'name',
      customer_type: 'type',
      industry: 'industry',
      status: 'status',
      updated_at: 'sync_time'
    }
  },
  supplier: {
    targetTable: 'etl_supplier_srm',
    mappings: {
      supplier_id: 'id',
      supplier_name: 'name',
      supplier_type: 'type',
      qualification_level: 'level',
      cooperation_status: 'status',
      updated_at: 'sync_time'
    }
  },
  product: {
    targetTable: 'etl_product_inventory',
    mappings: {
      product_id: 'id',
      product_name: 'name',
      product_code: 'code',
      product_category: 'category',
      cost_price: 'cost',
      sale_price: 'price',
      stock_warning_num: 'warning',
      status: 'status',
      updated_at: 'sync_time'
    }
  },
  order: {
    targetTable: 'etl_order_sales',
    mappings: {
      order_id: 'id',
      customer_id: 'customer_id',
      order_amount: 'amount',
      order_status: 'status',
      created_at: 'create_time',
      updated_at: 'sync_time'
    }
  },
  inventory: {
    targetTable: 'etl_inventory_warehouse',
    mappings: {
      product_id: 'product_id',
      warehouse_id: 'warehouse_id',
      quantity: 'qty',
      updated_at: 'sync_time'
    }
  },
  production: {
    targetTable: 'etl_production_manufacturing',
    mappings: {
      workorder_id: 'id',
      product_id: 'product_id',
      planned_qty: 'planned',
      actual_qty: 'actual',
      status: 'status',
      updated_at: 'sync_time'
    }
  },
  quality: {
    targetTable: 'etl_quality_check',
    mappings: {
      inspect_id: 'id',
      product_id: 'product_id',
      result: 'result',
      defect_count: 'defects',
      updated_at: 'sync_time'
    }
  },
  hr: {
    targetTable: 'etl_hr_personnel',
    mappings: {
      employee_id: 'id',
      employee_name: 'name',
      department_id: 'dept_id',
      position: 'position',
      status: 'status',
      updated_at: 'sync_time'
    }
  }
};

const ALL_EVENTS = [
  eventDefinitions.crm?.customer?.create,
  eventDefinitions.crm?.customer?.update,
  eventDefinitions.crm?.customer?.follow,
  eventDefinitions.crm?.customer?.archive,
  eventDefinitions.sale?.quotation?.create,
  eventDefinitions.sale?.order?.created,
  eventDefinitions.sale?.order?.audit,
  eventDefinitions.sale?.payment?.receive,
  eventDefinitions.project?.create,
  eventDefinitions.project?.milestone?.update,
  eventDefinitions.project?.task?.finish,
  eventDefinitions.project?.close,
  eventDefinitions.tech?.route?.create,
  eventDefinitions.tech?.route?.update,
  eventDefinitions.tech?.doc?.change,
  eventDefinitions.srm?.supplier?.audit,
  eventDefinitions.srm?.purchase?.create,
  eventDefinitions.srm?.purchase?.arrive,
  eventDefinitions.inv?.inbound,
  eventDefinitions.inv?.outbound,
  eventDefinitions.inv?.stock?.change,
  eventDefinitions.inv?.check?.finish,
  eventDefinitions.qc?.inspect?.create,
  eventDefinitions.qc?.inspect?.pass,
  eventDefinitions.qc?.defect?.create,
  eventDefinitions.qc?.rectify?.finish,
  eventDefinitions.hr?.employee?.create,
  eventDefinitions.hr?.employee?.leave,
  eventDefinitions.hr?.department?.update,
  eventDefinitions.admin?.asset?.change,
  eventDefinitions.admin?.approval?.finish,
  eventDefinitions.prd?.workorder?.create,
  eventDefinitions.prd?.report?.finish,
  eventDefinitions.prd?.product?.instock,
  eventDefinitions.rd?.bom?.update,
  eventDefinitions.rd?.fmea?.update,
  eventDefinitions.rd?.version?.release,
  eventDefinitions.after?.repair?.create,
  eventDefinitions.after?.repair?.finish,
  eventDefinitions.after?.solved,
  eventDefinitions.file?.upload,
  eventDefinitions.file?.update,
  eventDefinitions.file?.delete,
  eventDefinitions.kb?.article?.create,
  eventDefinitions.kb?.article?.update,
  eventDefinitions.finance?.receivable?.create,
  eventDefinitions.finance?.payable?.create,
  eventDefinitions.finance?.cost?.calc,
  eventDefinitions.mdms?.customer?.create,
  eventDefinitions.mdms?.customer?.update,
  eventDefinitions.mdms?.customer?.delete,
  eventDefinitions.mdms?.supplier?.create,
  eventDefinitions.mdms?.supplier?.update,
  eventDefinitions.mdms?.supplier?.delete,
  eventDefinitions.mdms?.product?.create,
  eventDefinitions.mdms?.product?.update,
  eventDefinitions.mdms?.product?.delete,
  eventDefinitions.mdms?.material?.create,
  eventDefinitions.mdms?.material?.update,
  eventDefinitions.mdms?.material?.delete,
  eventDefinitions.mdms?.employee?.create,
  eventDefinitions.mdms?.employee?.update,
  eventDefinitions.mdms?.employee?.delete,
  eventDefinitions.mdms?.org?.create,
  eventDefinitions.mdms?.org?.update,
  eventDefinitions.mdms?.org?.delete,
  eventDefinitions.ai?.data?.sync,
  eventDefinitions.ai?.data?.summary?.generate,
  eventDefinitions.ai?.data?.recommend?.generate,
  eventDefinitions.ai?.risk?.warning,
  eventDefinitions.ai?.model?.switch,
  eventDefinitions.ai?.knowledge?.match,
  eventDefinitions.ai?.analysis?.finish,
  eventDefinitions.social?.user?.sync,
  eventDefinitions.social?.org?.sync,
  eventDefinitions.social?.approval?.push,
  eventDefinitions.social?.approval?.callback,
  eventDefinitions.social?.todo?.create,
  eventDefinitions.social?.todo?.finish
].filter(Boolean);

async function ensureEtlTables() {
  const pool = await db.getPool();
  const request = pool.request();

  const tables = [
    `IF OBJECT_ID('dbo.etl_customer_sales','U') IS NULL
     CREATE TABLE dbo.etl_customer_sales (
       id INT PRIMARY KEY, customer_name NVARCHAR(255), customer_type NVARCHAR(50),
       industry NVARCHAR(100), status NVARCHAR(50), sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_supplier_srm','U') IS NULL
     CREATE TABLE dbo.etl_supplier_srm (
       id INT PRIMARY KEY, supplier_name NVARCHAR(255), supplier_type NVARCHAR(50),
       qualification_level NVARCHAR(50), cooperation_status NVARCHAR(50), sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_product_inventory','U') IS NULL
     CREATE TABLE dbo.etl_product_inventory (
       id INT PRIMARY KEY, product_name NVARCHAR(255), product_code NVARCHAR(100),
       product_category NVARCHAR(100), cost_price DECIMAL(18,2), sale_price DECIMAL(18,2),
       stock_warning_num INT, status NVARCHAR(50), sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_order_sales','U') IS NULL
     CREATE TABLE dbo.etl_order_sales (
       id INT PRIMARY KEY, customer_id INT, order_amount DECIMAL(18,2),
       order_status NVARCHAR(50), create_time DATETIME, sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_inventory_warehouse','U') IS NULL
     CREATE TABLE dbo.etl_inventory_warehouse (
       id INT IDENTITY(1,1) PRIMARY KEY, product_id INT, warehouse_id INT,
       quantity INT, sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_production_manufacturing','U') IS NULL
     CREATE TABLE dbo.etl_production_manufacturing (
       id INT PRIMARY KEY, product_id INT, planned_qty INT, actual_qty INT,
       status NVARCHAR(50), sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_quality_check','U') IS NULL
     CREATE TABLE dbo.etl_quality_check (
       id INT PRIMARY KEY, product_id INT, result NVARCHAR(50),
       defect_count INT, sync_time DATETIME DEFAULT GETDATE()
     )`,
    `IF OBJECT_ID('dbo.etl_hr_personnel','U') IS NULL
     CREATE TABLE dbo.etl_hr_personnel (
       id INT PRIMARY KEY, employee_name NVARCHAR(100), department_id INT,
       position NVARCHAR(100), status NVARCHAR(20), sync_time DATETIME DEFAULT GETDATE()
     )`
  ];

  for (const sql of tables) {
    await request.query(sql);
  }

  console.log('[ETL] All data warehouse tables ensured');
}

async function syncToDataWarehouse(event) {
  try {
    let entityData;
    let eventName;

    if (event && event.header && event.body) {
      entityData = event.body;
      eventName = event.header.eventName;
    } else {
      entityData = event;
      eventName = event.eventName || event.type;
    }

    const businessType = getBusinessTypeFromEvent(eventName);
    const rule = ETL_RULES[businessType];
    if (!rule) {
      console.log(`[ETL] No ETL rule for ${eventName}, skipping`);
      return;
    }

    const pool = await db.getPool();
    const request = pool.request();

    const fields = Object.keys(rule.mappings);
    const setClause = fields.slice(1).map(f => `${f} = @${f}`).join(', ');
    const updateSql = `UPDATE dbo.${rule.targetTable} SET ${setClause}, sync_time = GETDATE() WHERE ${Object.keys(rule.mappings)[0]} = @id; IF @@ROWCOUNT = 0 BEGIN INSERT INTO dbo.${rule.targetTable} (${fields.join(', ')}, sync_time) VALUES (${fields.map(f => '@' + f).join(', ')}, GETDATE()); END`;

    for (const field of fields) {
      const dbField = rule.mappings[field];
      request.input(field, db.sql.NVarChar, entityData[dbField] || null);
    }

    await request.query(updateSql);
    console.log(`[ETL] Synced ${eventName} to ${rule.targetTable}`);
  } catch (err) {
    console.error('[ETL] Sync failed:', err);
  }
}

function getBusinessTypeFromEvent(eventName) {
  if (!eventName) return null;
  const prefix = eventName.split('.')[0];
  const prefixMap = {
    'crm': 'customer',
    'sale': 'order',
    'srm': 'supplier',
    'inv': 'inventory',
    'prd': 'production',
    'qc': 'quality',
    'hr': 'hr',
    'mdms': 'product',
    'after': 'customer',
    'project': 'order'
  };
  return prefixMap[prefix] || null;
}

async function start() {
  try {
    await ensureEtlTables();

    for (const eventName of ALL_EVENTS) {
      eventBus.subscribe(eventName, syncToDataWarehouse);
    }

    console.log(`[ETL] Started, subscribed to ${ALL_EVENTS.length} events`);
  } catch (err) {
    console.error('[ETL] Start failed:', err);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start, syncToDataWarehouse, ETL_RULES };