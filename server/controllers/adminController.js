const express = require('express');
const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const router = express.Router();

const generateCode = async (pool, prefix, tableName, columnName) => {
  const result = await pool.request().query(`
    SELECT TOP 1 ${columnName} FROM ${tableName} WHERE ${columnName} IS NOT NULL ORDER BY ${columnName} DESC
  `);
  let newCode = prefix + '00001';
  if (result.recordset.length > 0) {
    const maxCode = result.recordset[0][columnName];
    const num = parseInt(maxCode.replace(prefix, '')) + 1;
    newCode = prefix + num.toString().padStart(5, '0');
  }
  return newCode;
};

const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM admin_vehicles WHERE 1=1';
    let countRequest = pool.request();
    if (keyword) {
      query += ' AND (plate_number LIKE @keyword OR vehicle_code LIKE @keyword)';
      countRequest = countRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    }
    if (status) {
      query += ' AND status = @status';
      countRequest = countRequest.input('status', sql.NVarChar, status);
    }

    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    const dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM admin_vehicles WHERE 1=1
        ${keyword ? "AND (plate_number LIKE @keyword OR vehicle_code LIKE @keyword)" : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    if (keyword) dataRequest = dataRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    if (status) dataRequest = dataRequest.input('status', sql.NVarChar, status);

    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取车辆列表失败:', error);
    res.status(500).json({ success: false, message: '获取车辆列表失败' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      plate_number, vehicle_type, brand, model, color, purchase_date,
      purchase_price, mileage, fuel_type, insurance_expiry, inspection_expiry, driver, remarks
    } = req.body;

    const pool = await getPool();
    const vehicle_code = await generateCode(pool, 'ADMIN_VEH_', 'admin_vehicles', 'vehicle_code');

    const result = await pool.request()
      .input('vehicle_code', sql.NVarChar, vehicle_code)
      .input('plate_number', sql.NVarChar, plate_number)
      .input('vehicle_type', sql.NVarChar, vehicle_type)
      .input('brand', sql.NVarChar, brand)
      .input('model', sql.NVarChar, model)
      .input('color', sql.NVarChar, color)
      .input('purchase_date', sql.Date, purchase_date)
      .input('purchase_price', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('mileage', sql.Int, mileage ? parseInt(mileage) : null)
      .input('fuel_type', sql.NVarChar, fuel_type)
      .input('insurance_expiry', sql.Date, insurance_expiry)
      .input('inspection_expiry', sql.Date, inspection_expiry)
      .input('driver', sql.NVarChar, driver)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO admin_vehicles (
          vehicle_code, plate_number, vehicle_type, brand, model, color, purchase_date,
          purchase_price, mileage, fuel_type, insurance_expiry, inspection_expiry, driver, remarks
        ) VALUES (
          @vehicle_code, @plate_number, @vehicle_type, @brand, @model, @color, @purchase_date,
          @purchase_price, @mileage, @fuel_type, @insurance_expiry, @inspection_expiry, @driver, @remarks
        )
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_VEHICLE', req.user?.id, { vehicleId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, vehicle_code }, message: '车辆创建成功' });
  } catch (error) {
    console.error('创建车辆失败:', error);
    res.status(500).json({ success: false, message: '创建车辆失败' });
  }
};

const getAllSupplies = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM admin_supplies WHERE 1=1';
    let countRequest = pool.request();
    if (keyword) {
      query += ' AND (supply_name LIKE @keyword OR supply_code LIKE @keyword)';
      countRequest = countRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    }
    if (category) {
      query += ' AND category = @category';
      countRequest = countRequest.input('category', sql.NVarChar, category);
    }

    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    const dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM admin_supplies WHERE 1=1
        ${keyword ? "AND (supply_name LIKE @keyword OR supply_code LIKE @keyword)" : ''}
        ${category ? 'AND category = @category' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    if (keyword) dataRequest = dataRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    if (category) dataRequest = dataRequest.input('category', sql.NVarChar, category);

    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取办公用品列表失败:', error);
    res.status(500).json({ success: false, message: '获取办公用品列表失败' });
  }
};

const createSupply = async (req, res) => {
  try {
    const { supply_name, category, unit, stock_quantity, min_stock, location, supplier, unit_price, remarks } = req.body;
    const pool = await getPool();
    const supply_code = await generateCode(pool, 'ADMIN_SUP_', 'admin_supplies', 'supply_code');

    const result = await pool.request()
      .input('supply_code', sql.NVarChar, supply_code)
      .input('supply_name', sql.NVarChar, supply_name)
      .input('category', sql.NVarChar, category)
      .input('unit', sql.NVarChar, unit)
      .input('stock_quantity', sql.Int, stock_quantity ? parseInt(stock_quantity) : 0)
      .input('min_stock', sql.Int, min_stock ? parseInt(min_stock) : 10)
      .input('location', sql.NVarChar, location)
      .input('supplier', sql.NVarChar, supplier)
      .input('unit_price', sql.Decimal(10, 2), unit_price ? parseFloat(unit_price) : null)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO admin_supplies (supply_code, supply_name, category, unit, stock_quantity, min_stock, location, supplier, unit_price, remarks)
        VALUES (@supply_code, @supply_name, @category, @unit, @stock_quantity, @min_stock, @location, @supplier, @unit_price, @remarks)
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_SUPPLY', req.user?.id, { supplyId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, supply_code }, message: '办公用品创建成功' });
  } catch (error) {
    console.error('创建办公用品失败:', error);
    res.status(500).json({ success: false, message: '创建办公用品失败' });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', category = '', priority = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM admin_announcements WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (title LIKE @keyword OR content LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (category) {
      query += ' AND category = @category';
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (priority) {
      query += ' AND priority = @priority';
      params.push({ name: 'priority', type: sql.NVarChar, value: priority });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY publish_date DESC) as RowNum
        FROM admin_announcements WHERE 1=1
        ${keyword ? "AND (title LIKE @keyword OR content LIKE @keyword)" : ''}
        ${category ? 'AND category = @category' : ''}
        ${priority ? 'AND priority = @priority' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ success: false, message: '获取公告列表失败' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, publish_date, expiry_date, attachment_urls, remarks } = req.body;
    const pool = await getPool();
    const announcement_code = await generateCode(pool, 'ADMIN_ANN_', 'admin_announcements', 'announcement_code');

    const result = await pool.request()
      .input('announcement_code', sql.NVarChar, announcement_code)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('category', sql.NVarChar, category)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('publish_date', sql.DateTime, publish_date || new Date())
      .input('expiry_date', sql.Date, expiry_date)
      .input('attachment_urls', sql.NVarChar, attachment_urls)
      .input('remarks', sql.NVarChar, remarks)
      .input('publisher', sql.NVarChar, req.user?.name || '系统')
      .query(`
        INSERT INTO admin_announcements (announcement_code, title, content, category, priority, publish_date, expiry_date, attachment_urls, remarks, publisher)
        VALUES (@announcement_code, @title, @content, @category, @priority, @publish_date, @expiry_date, @attachment_urls, @remarks, @publisher)
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_ANNOUNCEMENT', req.user?.id, { announcementId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, announcement_code }, message: '公告创建成功' });
  } catch (error) {
    console.error('创建公告失败:', error);
    res.status(500).json({ success: false, message: '创建公告失败' });
  }
};

const getAllAssets = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', category = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await getPool();

    let query = 'SELECT COUNT(*) as total FROM admin_assets WHERE 1=1';
    let params = [];
    if (keyword) {
      query += ' AND (asset_name LIKE @keyword OR asset_code LIKE @keyword OR serial_number LIKE @keyword)';
      params.push({ name: 'keyword', type: sql.NVarChar, value: `%${keyword}%` });
    }
    if (category) {
      query += ' AND category = @category';
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (status) {
      query += ' AND status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }

    let countRequest = pool.request();
    params.forEach(p => countRequest = countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(query);
    const total = countResult.recordset[0].total;

    let dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as RowNum
        FROM admin_assets WHERE 1=1
        ${keyword ? "AND (asset_name LIKE @keyword OR asset_code LIKE @keyword OR serial_number LIKE @keyword)" : ''}
        ${category ? 'AND category = @category' : ''}
        ${status ? 'AND status = @status' : ''}
      ) AS SubQuery
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    let dataRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    params.forEach(p => dataRequest = dataRequest.input(p.name, p.type, p.value));
    const result = await dataRequest.query(dataQuery);

    res.json({
      success: true,
      data: { list: result.recordset, pagination: { page: parseInt(page), limit: parseInt(limit), total } }
    });
  } catch (error) {
    console.error('获取资产列表失败:', error);
    res.status(500).json({ success: false, message: '获取资产列表失败' });
  }
};

const createAsset = async (req, res) => {
  try {
    const {
      asset_name, category, serial_number, purchase_date, purchase_price,
      depreciation_rate, location, custodian, supplier, warranty_expiry, remarks
    } = req.body;
    const pool = await getPool();
    const asset_code = await generateCode(pool, 'ADMIN_ASSET_', 'admin_assets', 'asset_code');

    const result = await pool.request()
      .input('asset_code', sql.NVarChar, asset_code)
      .input('asset_name', sql.NVarChar, asset_name)
      .input('category', sql.NVarChar, category)
      .input('serial_number', sql.NVarChar, serial_number)
      .input('purchase_date', sql.Date, purchase_date)
      .input('purchase_price', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('depreciation_rate', sql.Decimal(4, 2), depreciation_rate ? parseFloat(depreciation_rate) : null)
      .input('current_value', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('location', sql.NVarChar, location)
      .input('custodian', sql.NVarChar, custodian)
      .input('supplier', sql.NVarChar, supplier)
      .input('warranty_expiry', sql.Date, warranty_expiry)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO admin_assets (asset_code, asset_name, category, serial_number, purchase_date, purchase_price, depreciation_rate, current_value, location, custodian, supplier, warranty_expiry, remarks)
        VALUES (@asset_code, @asset_name, @category, @serial_number, @purchase_date, @purchase_price, @depreciation_rate, @current_value, @location, @custodian, @supplier, @warranty_expiry, @remarks)
        SELECT SCOPE_IDENTITY() as id
      `);

    await AuditLog.log('CREATE_ASSET', req.user?.id, { assetId: result.recordset[0].id }, req);
    res.json({ success: true, data: { id: result.recordset[0].id, asset_code }, message: '资产创建成功' });
  } catch (error) {
    console.error('创建资产失败:', error);
    res.status(500).json({ success: false, message: '创建资产失败' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plate_number, vehicle_type, brand, model, color, purchase_date,
      purchase_price, mileage, fuel_type, insurance_expiry, inspection_expiry, driver, status, remarks
    } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('plate_number', sql.NVarChar, plate_number)
      .input('vehicle_type', sql.NVarChar, vehicle_type)
      .input('brand', sql.NVarChar, brand)
      .input('model', sql.NVarChar, model)
      .input('color', sql.NVarChar, color)
      .input('purchase_date', sql.Date, purchase_date)
      .input('purchase_price', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('mileage', sql.Int, mileage ? parseInt(mileage) : null)
      .input('fuel_type', sql.NVarChar, fuel_type)
      .input('insurance_expiry', sql.Date, insurance_expiry)
      .input('inspection_expiry', sql.Date, inspection_expiry)
      .input('driver', sql.NVarChar, driver)
      .input('status', sql.NVarChar, status)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE admin_vehicles SET
          plate_number = @plate_number, vehicle_type = @vehicle_type, brand = @brand,
          model = @model, color = @color, purchase_date = @purchase_date,
          purchase_price = @purchase_price, mileage = @mileage, fuel_type = @fuel_type,
          insurance_expiry = @insurance_expiry, inspection_expiry = @inspection_expiry,
          driver = @driver, status = @status, remarks = @remarks, updated_at = GETDATE()
        WHERE id = @id
      `);

    await AuditLog.log('UPDATE_VEHICLE', req.user?.id, { vehicleId: id }, req);
    res.json({ success: true, message: '车辆更新成功' });
  } catch (error) {
    console.error('更新车辆失败:', error);
    res.status(500).json({ success: false, message: '更新车辆失败' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM admin_vehicles WHERE id = @id');
    await AuditLog.log('DELETE_VEHICLE', req.user?.id, { vehicleId: id }, req);
    res.json({ success: true, message: '车辆删除成功' });
  } catch (error) {
    console.error('删除车辆失败:', error);
    res.status(500).json({ success: false, message: '删除车辆失败' });
  }
};

const updateSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const { supply_name, category, unit, stock_quantity, min_stock, location, supplier, unit_price, remarks } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('supply_name', sql.NVarChar, supply_name)
      .input('category', sql.NVarChar, category)
      .input('unit', sql.NVarChar, unit)
      .input('stock_quantity', sql.Int, stock_quantity ? parseInt(stock_quantity) : 0)
      .input('min_stock', sql.Int, min_stock ? parseInt(min_stock) : 10)
      .input('location', sql.NVarChar, location)
      .input('supplier', sql.NVarChar, supplier)
      .input('unit_price', sql.Decimal(10, 2), unit_price ? parseFloat(unit_price) : null)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE admin_supplies SET
          supply_name = @supply_name, category = @category, unit = @unit,
          stock_quantity = @stock_quantity, min_stock = @min_stock, location = @location,
          supplier = @supplier, unit_price = @unit_price, remarks = @remarks, updated_at = GETDATE()
        WHERE id = @id
      `);
    await AuditLog.log('UPDATE_SUPPLY', req.user?.id, { supplyId: id }, req);
    res.json({ success: true, message: '办公用品更新成功' });
  } catch (error) {
    console.error('更新办公用品失败:', error);
    res.status(500).json({ success: false, message: '更新办公用品失败' });
  }
};

const deleteSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM admin_supplies WHERE id = @id');
    await AuditLog.log('DELETE_SUPPLY', req.user?.id, { supplyId: id }, req);
    res.json({ success: true, message: '办公用品删除成功' });
  } catch (error) {
    console.error('删除办公用品失败:', error);
    res.status(500).json({ success: false, message: '删除办公用品失败' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, publish_date, expiry_date, attachment_urls, remarks } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('category', sql.NVarChar, category)
      .input('priority', sql.NVarChar, priority || 'normal')
      .input('publish_date', sql.DateTime, publish_date)
      .input('expiry_date', sql.Date, expiry_date)
      .input('attachment_urls', sql.NVarChar, attachment_urls)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE admin_announcements SET
          title = @title, content = @content, category = @category, priority = @priority,
          publish_date = @publish_date, expiry_date = @expiry_date,
          attachment_urls = @attachment_urls, remarks = @remarks, updated_at = GETDATE()
        WHERE id = @id
      `);
    await AuditLog.log('UPDATE_ANNOUNCEMENT', req.user?.id, { announcementId: id }, req);
    res.json({ success: true, message: '公告更新成功' });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ success: false, message: '更新公告失败' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM admin_announcements WHERE id = @id');
    await AuditLog.log('DELETE_ANNOUNCEMENT', req.user?.id, { announcementId: id }, req);
    res.json({ success: true, message: '公告删除成功' });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({ success: false, message: '删除公告失败' });
  }
};

const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      asset_name, category, serial_number, purchase_date, purchase_price,
      depreciation_rate, location, custodian, supplier, warranty_expiry, status, remarks
    } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('asset_name', sql.NVarChar, asset_name)
      .input('category', sql.NVarChar, category)
      .input('serial_number', sql.NVarChar, serial_number)
      .input('purchase_date', sql.Date, purchase_date)
      .input('purchase_price', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('depreciation_rate', sql.Decimal(4, 2), depreciation_rate ? parseFloat(depreciation_rate) : null)
      .input('current_value', sql.Decimal(12, 2), purchase_price ? parseFloat(purchase_price) : null)
      .input('location', sql.NVarChar, location)
      .input('custodian', sql.NVarChar, custodian)
      .input('supplier', sql.NVarChar, supplier)
      .input('warranty_expiry', sql.Date, warranty_expiry)
      .input('status', sql.NVarChar, status)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE admin_assets SET
          asset_name = @asset_name, category = @category, serial_number = @serial_number,
          purchase_date = @purchase_date, purchase_price = @purchase_price,
          depreciation_rate = @depreciation_rate, current_value = @current_value,
          location = @location, custodian = @custodian, supplier = @supplier,
          warranty_expiry = @warranty_expiry, status = @status, remarks = @remarks, updated_at = GETDATE()
        WHERE id = @id
      `);
    await AuditLog.log('UPDATE_ASSET', req.user?.id, { assetId: id }, req);
    res.json({ success: true, message: '资产更新成功' });
  } catch (error) {
    console.error('更新资产失败:', error);
    res.status(500).json({ success: false, message: '更新资产失败' });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM admin_assets WHERE id = @id');
    await AuditLog.log('DELETE_ASSET', req.user?.id, { assetId: id }, req);
    res.json({ success: true, message: '资产删除成功' });
  } catch (error) {
    console.error('删除资产失败:', error);
    res.status(500).json({ success: false, message: '删除资产失败' });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF OBJECT_ID('dbo.sys_roles','U') IS NULL
      CREATE TABLE dbo.sys_roles (
        role_id INT IDENTITY(1,1) PRIMARY KEY,
        role_code NVARCHAR(50) NOT NULL UNIQUE,
        role_name NVARCHAR(100) NOT NULL,
        role_desc NVARCHAR(500) NULL,
        status NVARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    const roleCount = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.sys_roles');
    if (roleCount.recordset[0].cnt === 0) {
      await pool.request().query(`
        INSERT INTO dbo.sys_roles (role_code, role_name, role_desc, status)
        VALUES
          ('admin', '系统管理员', '拥有系统所有权限', 'active'),
          ('supervisor', '主管', '管理部门和下属员工', 'active'),
          ('manager', '经理', '管理特定业务模块', 'active'),
          ('employee', '普通员工', '基本操作权限', 'active'),
          ('finance', '财务', '财务相关权限', 'active'),
          ('hr', '人事', '人事管理权限', 'active'),
          ('warehouse', '仓库管理员', '仓库管理权限', 'active'),
          ('sales', '销售', '销售管理权限', 'active')
      `);
    }

    const result = await pool.request().query(`
      SELECT role_id as id, role_code as code, role_name as name, role_desc as description, status, created_at, updated_at
      FROM dbo.sys_roles
      WHERE status = 'active'
      ORDER BY role_id ASC
    `);
    res.json(res.formatResponse(true, result.recordset, '获取角色列表成功'));
  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json(res.formatResponse(false, null, '获取角色列表失败'));
  }
};

router.get('/vehicles', getAllVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);
router.get('/supplies', getAllSupplies);
router.post('/supplies', createSupply);
router.put('/supplies/:id', updateSupply);
router.delete('/supplies/:id', deleteSupply);
router.get('/announcements', getAllAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
router.get('/assets', getAllAssets);
router.post('/assets', createAsset);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);
router.get('/roles', getAllRoles);

module.exports = {
  router,
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAllRoles
};