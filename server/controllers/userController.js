const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');
const eventBus = require('../services/eventBus');
const { eventDefinitions } = require('../services/eventSchema');

const router = express.Router();

const BUSINESS_TYPES = {
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  MATERIAL: 'MATERIAL'
};

const publishEmployeeEvent = (action, entityData, operator) => {
  try {
    const eventName = eventDefinitions.employee?.[action];
    if (eventName && eventBus) {
      eventBus.publish(eventName, {
        businessType: BUSINESS_TYPES.EMPLOYEE,
        action,
        entityData,
        operator
      });
    }
  } catch (err) {
    console.warn('事件发布失败:', err.message);
  }
};

// 自动同步职位辅助函数
const autoSyncPosition = async (pool, positionName, departmentId) => {
  if (!positionName || positionName.trim() === '') return null;
  
  try {
    // 1. 检查职位是否已存在
    const checkResult = await pool.request()
      .input('position_name', sql.NVarChar, positionName)
      .input('department_id', sql.Int, departmentId)
      .query(`
        SELECT id FROM sys_positions 
        WHERE position_name = @position_name 
          AND (department_id = @department_id OR (department_id IS NULL AND @department_id IS NULL))
          AND status = 'active'
      `);
    
    if (checkResult.recordset.length > 0) {
      return checkResult.recordset[0].id;
    }
    
    // 2. 创建新职位
    const positionCode = `POS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const insertResult = await pool.request()
      .input('position_code', sql.NVarChar, positionCode)
      .input('position_name', sql.NVarChar, positionName)
      .input('department_id', sql.Int, departmentId)
      .input('position_type', sql.NVarChar, 'common')
      .input('description', sql.NVarChar, '自动同步创建')
      .query(`
        INSERT INTO sys_positions (position_code, position_name, department_id, position_type, description, sort_order, status)
        OUTPUT INSERTED.id
        VALUES (@position_code, @position_name, @department_id, @position_type, @description, 0, 'active')
      `);
    
    console.log(`自动创建职位: ${positionName}, ID: ${insertResult.recordset[0].id}`);
    return insertResult.recordset[0].id;
  } catch (error) {
    console.error('自动同步职位失败:', error);
    return null;
  }
};

// 获取所有用户
const getAllUsers = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT u.*, d.name as department_name, t.name as team_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.status = 'active'
        ORDER BY u.department_id, u.id
      `);
    
    // 解析权限字段
    const users = result.recordset.map(user => ({
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : {},
      data_permission: user.data_permission ? JSON.parse(user.data_permission) : null
    }));
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
};

// 创建用户
const createUser = async (req, res) => {
  try {
    const {
      employee_no, name, role, department_id, team_id,
      position, position_id, phone, email, permissions, data_permission, password,
      gender, join_date
    } = req.body;

    console.log('创建用户 - 请求数据:', { employee_no, name, role, department_id, team_id, position, position_id, phone, email, gender, join_date });

    const pool = await getPool();

    // 自动同步职位
    let finalPositionId = position_id;
    if (position && !position_id) {
      finalPositionId = await autoSyncPosition(pool, position, department_id);
    }

    // 加密密码
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const permissionsStr = permissions ? JSON.stringify(permissions) : null;
    const dataPermissionStr = data_permission ? JSON.stringify(data_permission) : null;

    // 构建插入语句
    let insertFields = 'employee_no, name, role, department_id, team_id, position, position_id, phone, email, permissions, data_permission, created_by, created_at';
    let insertValues = '@employee_no, @name, @role, @department_id, @team_id, @position, @position_id, @phone, @email, @permissions, @data_permission, @created_by, GETDATE()';
    
    if (password_hash) {
      insertFields += ', password_hash';
      insertValues += ', @password_hash';
    }
    
    // 添加性别和入职时间字段
    if (gender) {
      insertFields += ', gender';
      insertValues += ', @gender';
    }
    if (join_date) {
      insertFields += ', join_date';
      insertValues += ', @join_date';
    }
    
    const result = await pool.request()
      .input('employee_no', sql.Int, employee_no || null)
      .input('name', sql.NVarChar, name)
      .input('role', sql.NVarChar, role)
      .input('department_id', sql.Int, department_id)
      .input('team_id', sql.Int, team_id || null)
      .input('position', sql.NVarChar, position)
      .input('position_id', sql.Int, finalPositionId || null)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('permissions', sql.NVarChar, permissionsStr)
      .input('data_permission', sql.NVarChar, dataPermissionStr)
      .input('created_by', sql.Int, req.user?.id)
      .input('password_hash', sql.NVarChar, password_hash)
      .input('gender', sql.NVarChar, gender || 'male')
      .input('join_date', sql.Date, join_date || null)
      .query(`
        INSERT INTO sys_users (${insertFields})
        VALUES (${insertValues});
        SELECT SCOPE_IDENTITY() as id;
      `);

    await AuditLog.log('CREATE_USER', req.user?.id, {
      userId: result.recordset[0].id,
      name
    }, req);

    publishEmployeeEvent('create', {
      id: result.recordset[0].id,
      employee_no,
      name,
      role,
      department_id,
      department_name: req.body.department_name,
      team_id,
      team_name: req.body.team_name,
      position,
      phone,
      email,
      gender,
      join_date,
      status: 'active'
    }, req.user?.name || req.user?.username);

    res.json({
      success: true,
      data: { id: result.recordset[0].id },
      message: '用户创建成功'
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    if (error.code === 'EREQUEST' && error.message.includes('UNIQUE KEY constraint')) {
      // 员工编号重复
      return res.status(400).json({ success: false, message: '员工编号已存在' });
    }
    res.status(500).json({ success: false, message: '创建用户失败：' + error.message });
  }
};

// 更新用户
const updateUser = async (req, res) => {
  try {
    let { id } = req.params;
    let {
      employee_no, name, role, department_id, team_id, position, phone, email,
      permissions, gender, join_date
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: '用户姓名不能为空' });
    }

    if (!department_id) {
      return res.status(400).json({ success: false, message: '所属部门不能为空' });
    }

    if (typeof id === 'string' && id.startsWith('user_')) {
      id = id.replace('user_', '');
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: '无效的用户ID' });
    }

    const pool = await getPool();

    const checkResult = await pool.request()
      .input('id', sql.Int, parsedId)
      .query('SELECT id FROM sys_users WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let permissionsStr = null;
    if (permissions) {
      try {
        if (typeof permissions === 'string') {
          permissionsStr = permissions;
        } else {
          permissionsStr = JSON.stringify(permissions);
        }
      } catch (e) {
        permissionsStr = null;
      }
    }

    const parsedDepartmentId = parseInt(department_id);
    const parsedTeamId = team_id ? parseInt(team_id) : null;
    const parsedUserId = req.user?.id ? parseInt(req.user.id) : null;
    const parsedEmployeeNo = employee_no ? String(employee_no) : null;

    const request = pool.request();
    request.input('id', sql.Int, parsedId);
    request.input('employee_no', sql.VarChar, parsedEmployeeNo);
    request.input('name', sql.NVarChar, String(name).trim());
    request.input('role', sql.VarChar, role || null);
    request.input('department_id', sql.Int, parsedDepartmentId);
    request.input('team_id', sql.Int, parsedTeamId);
    request.input('position', sql.NVarChar, position || null);
    request.input('phone', sql.NVarChar, phone || null);
    request.input('email', sql.NVarChar, email || null);
    request.input('permissions', sql.Text, permissionsStr);
    request.input('updated_by', sql.Int, parsedUserId);
    request.input('gender', sql.VarChar, gender || 'male');

    if (join_date) {
      request.input('join_date', sql.Date, join_date);
    }

    let updateFields = `
      employee_no = @employee_no,
      name = @name,
      role = @role,
      department_id = @department_id,
      team_id = @team_id,
      position = @position,
      phone = @phone,
      email = @email,
      permissions = @permissions,
      gender = @gender,
      updated_at = GETDATE(),
      updated_by = @updated_by
    `;

    if (join_date) {
      updateFields += ', join_date = @join_date';
    }

    await request.query(`UPDATE sys_users SET ${updateFields} WHERE id = @id`);

    try {
      if (parsedUserId) {
        await AuditLog.log('UPDATE_USER', parsedUserId, { userId: parsedId }, req);
      }
    } catch (auditErr) {
      console.warn('审计日志记录失败:', auditErr.message);
    }

    try {
      publishEmployeeEvent('update', {
        id: parsedId,
        employee_no: parsedEmployeeNo,
        name: String(name).trim(),
        department_id: parsedDepartmentId,
        team_id: parsedTeamId,
        position,
        phone,
        email,
        gender,
        join_date
      }, req.user?.name || req.user?.username);
    } catch (eventErr) {
      console.warn('事件发布失败:', eventErr.message);
    }

    res.json({
      success: true,
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);

    if (error.number === 2627) {
      return res.status(400).json({ success: false, message: '员工编号已存在，请使用其他编号' });
    }
    if (error.number === 547) {
      return res.status(400).json({ success: false, message: '关联的部门或职位不存在' });
    }
    if (error.number === 245) {
      return res.status(400).json({ success: false, message: '数据类型转换错误' });
    }

    res.status(500).json({
      success: false,
      message: '更新用户失败'
    });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    let { id } = req.params;
    
    // 处理带前缀的 ID（如 user_238）
    if (typeof id === 'string' && id.startsWith('user_')) {
      id = parseInt(id.replace('user_', ''));
    }
    
    const pool = await getPool();
    
    // 标记为删除
    await pool.request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_users SET
          status = 'deleted',
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);
    
    await AuditLog.log('DELETE_USER', req.user?.id, { userId: id }, req);

    publishEmployeeEvent('delete', { id }, req.user?.name || req.user?.username);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
};

// 获取销售岗位人员
const getSalesUsers = async (req, res) => {
  try {
    const pool = await getPool();
    console.log('开始查询销售用户列表...');
    
    const result = await pool.request()
      .query(`
        SELECT 
          u.id, u.employee_no, u.name, u.position, 
          ISNULL(u.position_id, 0) as position_id,
          ISNULL(u.department_id, 0) as department_id,
          ISNULL(u.team_id, 0) as team_id,
          u.role, u.phone, u.email, 
          u.permissions, u.data_permission, u.status,
          d.name as department_name, 
          t.name as team_name, 
          p.position_name, p.position_code
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        LEFT JOIN sys_positions p ON u.position_id = p.id
        WHERE u.status = 'active'
          AND (
            (p.position_code IS NOT NULL AND p.position_code LIKE '%SALES%')
            OR (p.position_name IS NOT NULL AND p.position_name LIKE '%销售%')
            OR (u.position IS NOT NULL AND u.position LIKE '%销售%')
            OR (u.position IS NOT NULL AND u.position LIKE '%业务员%')
            OR (u.position IS NOT NULL AND u.position LIKE '%销售经理%')
            OR (u.position IS NOT NULL AND u.position LIKE '%销售主管%')
            OR (u.position IS NOT NULL AND u.position LIKE '%销售总监%')
          )
        ORDER BY u.department_id, u.id
      `);

    console.log('查询到销售用户数量:', result.recordset.length);

    // 解析权限字段
    const users = result.recordset.map(user => {
      try {
        return {
          ...user,
          permissions: user.permissions ? JSON.parse(user.permissions) : {},
          data_permission: user.data_permission ? JSON.parse(user.data_permission) : null
        };
      } catch (parseError) {
        console.error('解析用户权限失败:', user.id, parseError);
        return {
          ...user,
          permissions: {},
          data_permission: null
        };
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取销售用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取销售用户列表失败: ' + error.message });
  }
};

router.get('/', getAllUsers);
router.get('/sales', getSalesUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = {
  router,
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const pool = await getPool();
      
      // 使用工号登录
      const result = await pool.request()
        .input('employee_no', sql.Int, username)
        .query(`
          SELECT * FROM sys_users 
          WHERE employee_no = @employee_no AND status = 'active'
        `);
      
      if (result.recordset.length === 0) {
        return res.status(401).json({ success: false, message: '工号或密码错误' });
      }
      
      const user = result.recordset[0];
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: '工号或密码错误' });
      }
      
      // 生成JWT token
      const token = jwt.sign(
        { id: user.id, employee_no: user.employee_no, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            employee_no: user.employee_no,
            name: user.name,
            role: user.role,
            department_id: user.department_id,
            position: user.position
          }
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ success: false, message: '登录失败' });
    }
  },
  getAllUsers,
  getSalesUsers,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser: async (req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, req.user.id)
        .query(`
          SELECT u.*, d.name as department_name
          FROM sys_users u
          LEFT JOIN sys_departments d ON u.department_id = d.id
          WHERE u.id = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const user = result.recordset[0];
      user.permissions = user.permissions ? JSON.parse(user.permissions) : {};
      user.data_permission = user.data_permission ? JSON.parse(user.data_permission) : null;
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      res.status(500).json({ success: false, message: '获取当前用户信息失败' });
    }
  },
  getUserById: async (req, res) => {
    try {
      let id = req.params.id;
      
      console.log('获取用户信息 - 原始 ID:', id, '类型:', typeof id);
      
      // 处理带前缀的 ID（如 user_238）
      if (typeof id === 'string' && id.startsWith('user_')) {
        id = parseInt(id.replace('user_', ''));
      }
      
      // 转换为整数
      id = parseInt(id);
      
      // 验证 ID 是否有效
      if (isNaN(id) || id <= 0) {
        console.error('无效的用户 ID:', id);
        return res.status(400).json({ success: false, message: '无效的用户 ID' });
      }
      
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT u.*, d.name as department_name
          FROM sys_users u
          LEFT JOIN sys_departments d ON u.department_id = d.id
          WHERE u.id = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const user = result.recordset[0];
      user.permissions = user.permissions ? JSON.parse(user.permissions) : {};
      user.data_permission = user.data_permission ? JSON.parse(user.data_permission) : null;
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
  }
};
