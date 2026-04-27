const db = require('../config/database');
const sql = db.sql;

// 获取所有职位
exports.getPositions = async (req, res) => {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query(`
      SELECT 
        p.*,
        d.name as department_name
      FROM sys_positions p
      LEFT JOIN sys_departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY p.position_type, p.sort_order, p.position_name
    `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error('获取职位列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取职位列表失败',
      error: err.message
    });
  }
};

// 获取职位详情
exports.getPositionById = async (req, res) => {
  try {
    const pool = await db.getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM sys_positions WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: '职位不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (err) {
    console.error('获取职位详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取职位详情失败',
      error: err.message
    });
  }
};

// 创建职位
exports.createPosition = async (req, res) => {
  try {
    const { position_code, position_name, department_id, position_type, description, sort_order } = req.body;
    
    const pool = await db.getPool();
    await pool.request()
      .input('position_code', sql.NVarChar, position_code)
      .input('position_name', sql.NVarChar, position_name)
      .input('department_id', sql.Int, department_id || null)
      .input('position_type', sql.NVarChar, position_type || 'common')
      .input('description', sql.NVarChar, description || null)
      .input('sort_order', sql.Int, sort_order || 0)
      .query(`
        INSERT INTO sys_positions (position_code, position_name, department_id, position_type, description, sort_order)
        VALUES (@position_code, @position_name, @department_id, @position_type, @description, @sort_order)
      `);
    
    res.json({
      success: true,
      message: '职位创建成功'
    });
  } catch (err) {
    console.error('创建职位失败:', err);
    res.status(500).json({
      success: false,
      message: '创建职位失败',
      error: err.message
    });
  }
};

// 更新职位
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position_code, position_name, department_id, position_type, description, sort_order, status } = req.body;
    
    const pool = await db.getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('position_code', sql.NVarChar, position_code)
      .input('position_name', sql.NVarChar, position_name)
      .input('department_id', sql.Int, department_id || null)
      .input('position_type', sql.NVarChar, position_type)
      .input('description', sql.NVarChar, description)
      .input('sort_order', sql.Int, sort_order)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE sys_positions 
        SET position_code = @position_code,
            position_name = @position_name,
            department_id = @department_id,
            position_type = @position_type,
            description = @description,
            sort_order = @sort_order,
            status = @status,
            updated_at = GETDATE()
        WHERE id = @id
      `);
    
    res.json({
      success: true,
      message: '职位更新成功'
    });
  } catch (err) {
    console.error('更新职位失败:', err);
    res.status(500).json({
      success: false,
      message: '更新职位失败',
      error: err.message
    });
  }
};

// 删除职位
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await db.getPool();
    
    // 检查职位是否存在
    const checkExist = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM sys_positions WHERE id = @id');
    
    if (checkExist.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: '职位不存在'
      });
    }
    
    // 检查是否有用户使用该职位
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM sys_users WHERE position_id = @id');
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该职位已被用户使用，无法删除'
      });
    }
    
    // 软删除 - 使用单引号
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE sys_positions SET status = 'inactive', updated_at = GETDATE() WHERE id = @id");
    
    res.json({
      success: true,
      message: '职位删除成功'
    });
  } catch (err) {
    console.error('删除职位失败:', err);
    res.status(500).json({
      success: false,
      message: '删除职位失败',
      error: err.message
    });
  }
};

// 按部门获取职位
exports.getPositionsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('departmentId', sql.Int, departmentId)
      .query(`
        SELECT * FROM sys_positions 
        WHERE (department_id = @departmentId OR department_id IS NULL) 
        AND status = 'active'
        ORDER BY position_type, sort_order, position_name
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error('获取部门职位失败:', err);
    res.status(500).json({
      success: false,
      message: '获取部门职位失败',
      error: err.message
    });
  }
};

// 同步用户职位到职位表
exports.syncPositionsFromUsers = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    // 1. 获取所有用户中存在的职位名称（去重）
    const userPositionsResult = await pool.request().query(`
      SELECT DISTINCT 
        u.position as position_name,
        u.department_id,
        d.name as department_name
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE u.position IS NOT NULL 
        AND u.position != ''
        AND u.status = 'active'
    `);
    
    const userPositions = userPositionsResult.recordset;
    console.log(`从用户表找到 ${userPositions.length} 个职位`);
    
    // 2. 获取当前职位表中所有职位
    const existingPositionsResult = await pool.request().query(`
      SELECT id, position_code, position_name, department_id, status
      FROM sys_positions
    `);
    
    const existingPositions = existingPositionsResult.recordset;
    
    // 3. 创建需要添加的职位
    let addedCount = 0;
    for (const userPos of userPositions) {
      // 检查是否已存在（按职位名称和部门匹配）
      const exists = existingPositions.some(ep => 
        ep.position_name === userPos.position_name && 
        (ep.department_id === userPos.department_id || 
         (ep.department_id === null && userPos.department_id === null))
      );
      
      if (!exists) {
        // 生成职位编码
        const positionCode = `POS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        await pool.request()
          .input('position_code', sql.NVarChar, positionCode)
          .input('position_name', sql.NVarChar, userPos.position_name)
          .input('department_id', sql.Int, userPos.department_id)
          .input('position_type', sql.NVarChar, 'common')
          .input('description', sql.NVarChar, `从用户管理同步 - ${userPos.department_name || '通用'}`)
          .query(`
            INSERT INTO sys_positions (position_code, position_name, department_id, position_type, description, sort_order, status)
            VALUES (@position_code, @position_name, @department_id, @position_type, @description, 0, 'active')
          `);
        
        addedCount++;
        console.log(`添加新职位: ${userPos.position_name}`);
      }
    }
    
    // 4. 标记不再使用的职位为 inactive
    // 获取所有用户正在使用的职位名称
    const activePositionNames = userPositions.map(up => up.position_name);
    
    let deactivatedCount = 0;
    for (const existPos of existingPositions) {
      // 如果职位不在用户使用的列表中，且当前是 active 状态
      if (!activePositionNames.includes(existPos.position_name) && existPos.status === 'active') {
        await pool.request()
          .input('id', sql.Int, existPos.id)
          .query(`
            UPDATE sys_positions 
            SET status = 'inactive', updated_at = GETDATE()
            WHERE id = @id
          `);
        
        deactivatedCount++;
        console.log(`停用职位: ${existPos.position_name}`);
      }
    }
    
    // 5. 更新用户的 position_id 字段（关联到正确的职位）
    await pool.request().query(`
      UPDATE u
      SET u.position_id = p.id
      FROM sys_users u
      INNER JOIN sys_positions p ON u.position = p.position_name
      WHERE p.status = 'active'
        AND (u.position_id IS NULL OR u.position_id != p.id)
    `);
    
    res.json({
      success: true,
      message: '职位同步完成',
      data: {
        added: addedCount,
        deactivated: deactivatedCount,
        totalUserPositions: userPositions.length
      }
    });
    
  } catch (err) {
    console.error('同步职位失败:', err);
    res.status(500).json({
      success: false,
      message: '同步职位失败',
      error: err.message
    });
  }
};
