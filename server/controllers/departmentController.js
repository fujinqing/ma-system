const express = require('express');
const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');
const eventBus = require('../services/eventBus');
const { BUSINESS_TYPES, EVENT_ACTIONS, eventDefinitions } = require('../services/eventSchema');

const router = express.Router();

const publishDepartmentEvent = (action, entityData, operator) => {
  const eventName = eventDefinitions.department[action];
  if (eventName) {
    eventBus.publish(eventName, {
      businessType: BUSINESS_TYPES.DEPARTMENT,
      action,
      entityData,
      operator
    });
  }
};

// 获取所有部门（树形结构）
const getAllDepartments = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT * FROM sys_departments 
        WHERE status = 'active' 
        ORDER BY sort_order, id
      `);
    
    // 构建树形结构
    const departments = result.recordset.map(dept => ({
      ...dept,
      positions: dept.positions ? dept.positions.split(',') : []
    }));
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('获取部门列表失败:', error);
    res.status(500).json({ success: false, message: '获取部门列表失败' });
  }
};

// 创建部门
const createDepartment = async (req, res) => {
  try {
    const {
      name, manager, headcount, icon, color, parent_id,
      positions, description, sort_order
    } = req.body;
    
    const pool = await getPool();
    
    // 生成部门编码
    const codeResult = await pool.request()
      .query(`
        SELECT department_code FROM sys_departments 
        WHERE department_code LIKE '[0-9][0-9]'
        ORDER BY department_code DESC
      `);
    
    let department_code = '01';
    if (codeResult.recordset.length > 0) {
      // 找到最大的数字编码
      let maxNum = 0;
      for (const row of codeResult.recordset) {
        const num = parseInt(row.department_code);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      department_code = (maxNum + 1).toString().padStart(2, '0');
    }
    
    // 计算层级
    let level = 1;
    if (parent_id) {
      const parentResult = await pool.request()
        .input('parent_id', sql.Int, parent_id)
        .query('SELECT level FROM sys_departments WHERE id = @parent_id');
      if (parentResult.recordset.length > 0) {
        level = parentResult.recordset[0].level + 1;
      }
    }
    
    const positionsStr = Array.isArray(positions) ? positions.join(',') : positions;
    
    const result = await pool.request()
      .input('department_code', sql.NVarChar, department_code)
      .input('name', sql.NVarChar, name)
      .input('manager', sql.NVarChar, manager)
      .input('headcount', sql.Int, headcount || 0)
      .input('icon', sql.NVarChar, icon || 'fa fa-building')
      .input('color', sql.NVarChar, color || '#165DFF')
      .input('parent_id', sql.Int, parent_id)
      .input('level', sql.Int, level)
      .input('sort_order', sql.Int, sort_order || 0)
      .input('positions', sql.NVarChar, positionsStr)
      .input('description', sql.NVarChar, description)
      .input('created_by', sql.Int, req.user?.id)
      .query(`
        INSERT INTO sys_departments (
          department_code, name, manager, headcount, icon, color,
          parent_id, level, sort_order, positions, description,
          created_by, created_at
        ) VALUES (
          @department_code, @name, @manager, @headcount, @icon, @color,
          @parent_id, @level, @sort_order, @positions, @description,
          @created_by, GETDATE()
        )
        SELECT SCOPE_IDENTITY() as id
      `);
    
    await AuditLog.log('CREATE_DEPARTMENT', req.user?.id, {
      departmentId: result.recordset[0].id,
      departmentName: name
    }, req);

    publishDepartmentEvent('create', {
      id: result.recordset[0].id,
      department_code,
      name,
      manager,
      headcount,
      parent_id,
      level,
      status: 'active'
    }, req.user?.name || req.user?.username);

    res.json({
      success: true,
      data: { id: result.recordset[0].id, department_code },
      message: '部门创建成功'
    });
  } catch (error) {
    console.error('创建部门失败:', error);
    res.status(500).json({ success: false, message: '创建部门失败' });
  }
};

// 更新部门
const updateDepartment = async (req, res) => {
  try {
    let { id } = req.params;
    const {
      name, manager, headcount, icon, color, parent_id,
      positions, description, sort_order
    } = req.body;
    
    // 处理带前缀的 ID（如 dept_13）
    if (typeof id === 'string' && id.startsWith('dept_')) {
      id = parseInt(id.replace('dept_', ''));
    }
    
    const pool = await getPool();
    const positionsStr = Array.isArray(positions) ? positions.join(',') : positions;
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('manager', sql.NVarChar, manager === null ? null : String(manager))
      .input('headcount', sql.Int, headcount)
      .input('icon', sql.NVarChar, icon)
      .input('color', sql.NVarChar, color)
      .input('parent_id', sql.Int, parent_id)
      .input('sort_order', sql.Int, sort_order)
      .input('positions', sql.NVarChar, positionsStr)
      .input('description', sql.NVarChar, description)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_departments SET
          name = @name,
          manager = @manager,
          headcount = @headcount,
          icon = @icon,
          color = @color,
          parent_id = @parent_id,
          sort_order = @sort_order,
          positions = @positions,
          description = @description,
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);
    
    await AuditLog.log('UPDATE_DEPARTMENT', req.user?.id, {
      departmentId: id,
      departmentName: name
    }, req);

    publishDepartmentEvent('update', {
      id,
      name,
      manager,
      headcount,
      parent_id,
      level,
      status: 'active'
    }, req.user?.name || req.user?.username);

    res.json({
      success: true,
      message: '部门更新成功'
    });
  } catch (error) {
    console.error('更新部门失败:', error);
    res.status(500).json({ success: false, message: '更新部门失败' });
  }
};

// 删除部门
const deleteDepartment = async (req, res) => {
  try {
    let { id } = req.params;
    
    // 处理带前缀的 ID（如 dept_30）
    if (typeof id === 'string' && id.startsWith('dept_')) {
      id = parseInt(id.replace('dept_', ''));
    }
    
    const pool = await getPool();
    
    // 检查是否有子部门
    const childrenResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM sys_departments WHERE parent_id = @id AND status = \'active\';');
    
    if (childrenResult.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该部门下有子部门，无法删除'
      });
    }
    
    // 检查是否有员工
    console.log('检查部门下的员工，部门ID:', id);
    const employeesResult = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT COUNT(*) as count FROM sys_users WHERE department_id = @id AND status = 'active';");
    console.log('员工检查结果:', employeesResult.recordset[0]);
    if (employeesResult.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该部门下有员工，无法删除'
      });
    }
    
    // 标记为删除
    await pool.request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_departments SET
          status = 'deleted',
          updated_at = GETDATE(),
          updated_by = @updated_by
        WHERE id = @id
      `);
    
    await AuditLog.log('DELETE_DEPARTMENT', req.user?.id, { departmentId: id }, req);

    publishDepartmentEvent('delete', { id }, req.user?.name || req.user?.username);

    res.json({
      success: true,
      message: '部门删除成功'
    });
  } catch (error) {
    console.error('删除部门失败:', error);
    res.status(500).json({ success: false, message: '删除部门失败' });
  }
};

// 获取部门树形结构
const getDepartmentTree = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT * FROM sys_departments 
        WHERE status = 'active' 
        ORDER BY sort_order, id
      `);
    
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          positions: item.positions ? item.positions.split(',') : [],
          children: buildTree(items, item.id)
        }));
    };
    
    const departments = result.recordset;
    const tree = buildTree(departments);
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('获取部门树失败:', error);
    res.status(500).json({ success: false, message: '获取部门树失败' });
  }
};

router.get('/', getAllDepartments);
router.get('/tree', getDepartmentTree);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = {
  router,
  getAllDepartments,
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
