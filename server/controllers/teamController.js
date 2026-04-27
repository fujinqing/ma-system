const express = require('express');
const sql = require('mssql');
const { getPool } = require('../config/database');
const AuditLog = require('../middleware/auditLog');

const router = express.Router();

// 获取所有团队
const getAllTeams = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT t.*, d.name as department_name, u.name as leader_name
        FROM sys_teams t
        LEFT JOIN sys_departments d ON t.department_id = d.id
        LEFT JOIN sys_users u ON t.leader_id = u.id
        WHERE t.status = 'active'
        ORDER BY t.sort_order, t.id
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('获取团队列表失败:', error);
    res.status(500).json({ success: false, message: '获取团队列表失败' });
  }
};

// 获取部门的团队
const getTeamsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('departmentId', sql.Int, departmentId)
      .query(`
        SELECT t.*, d.name as department_name, u.name as leader_name
        FROM sys_teams t
        LEFT JOIN sys_departments d ON t.department_id = d.id
        LEFT JOIN sys_users u ON t.leader_id = u.id
        WHERE t.department_id = @departmentId AND t.status = 'active'
        ORDER BY t.sort_order, t.id
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('获取部门团队失败:', error);
    res.status(500).json({ success: false, message: '获取部门团队失败' });
  }
};

// 创建团队
const createTeam = async (req, res) => {
  try {
    const {
      name,
      department_id,
      parent_team_id,
      leader_id,
      headcount,
      description,
      sort_order
    } = req.body;

    const pool = await getPool();

    // 生成团队编码
    const codeResult = await pool.request()
      .query(`
        SELECT TOP 1 team_code FROM sys_teams
        WHERE team_code IS NOT NULL
        ORDER BY team_code DESC
      `);

    let team_code = 'TEAM_001';
    if (codeResult.recordset.length > 0) {
      const maxCode = codeResult.recordset[0].team_code;
      const num = parseInt(maxCode.replace('TEAM_', '')) + 1;
      team_code = 'TEAM_' + num.toString().padStart(3, '0');
    }

    const result = await pool.request()
      .input('team_code', sql.NVarChar, team_code)
      .input('name', sql.NVarChar, name)
      .input('department_id', sql.Int, department_id)
      .input('parent_team_id', sql.Int, parent_team_id || null)
      .input('leader_id', sql.Int, leader_id || null)
      .input('headcount', sql.Int, headcount || 0)
      .input('description', sql.NVarChar, description || '')
      .input('sort_order', sql.Int, sort_order || 0)
      .input('created_by', sql.Int, req.user?.id)
      .query(`
        INSERT INTO sys_teams (
          team_code, name, department_id, parent_team_id, leader_id, headcount,
          description, sort_order, created_by
        ) VALUES (
          @team_code, @name, @department_id, @parent_team_id, @leader_id, @headcount,
          @description, @sort_order, @created_by
        )
        SELECT SCOPE_IDENTITY() as id
      `);
    
    await AuditLog.log('CREATE_TEAM', req.user?.id, { 
      teamId: result.recordset[0].id,
      teamName: name
    });
    
    res.json({
      success: true,
      data: {
        id: result.recordset[0].id,
        team_code,
        name
      }
    });
  } catch (error) {
    console.error('创建团队失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建团队失败',
      error: error.message
    });
  }
};

// 更新团队
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      department_id,
      parent_team_id,
      leader_id,
      headcount,
      description,
      status,
      sort_order
    } = req.body;

    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('department_id', sql.Int, department_id)
      .input('parent_team_id', sql.Int, parent_team_id || null)
      .input('leader_id', sql.Int, leader_id || null)
      .input('headcount', sql.Int, headcount || 0)
      .input('description', sql.NVarChar, description || '')
      .input('status', sql.NVarChar, status || 'active')
      .input('sort_order', sql.Int, sort_order || 0)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_teams SET
          name = @name,
          department_id = @department_id,
          parent_team_id = @parent_team_id,
          leader_id = @leader_id,
          headcount = @headcount,
          description = @description,
          status = @status,
          sort_order = @sort_order,
          updated_by = @updated_by,
          updated_at = GETDATE()
        WHERE id = @id
      `);
    
    await AuditLog.log('UPDATE_TEAM', req.user?.id, { 
      teamId: parseInt(id),
      teamName: name
    });
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新团队失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新团队失败',
      error: error.message
    });
  }
};

// 删除团队
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // 检查是否有用户关联到此团队
    const userCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM sys_users WHERE team_id = @id AND status = \'active\'');
    
    if (userCheck.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该团队还有成员，无法删除'
      });
    }
    
    // 软删除
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_teams SET
          status = 'inactive',
          updated_by = @updated_by,
          updated_at = GETDATE()
        WHERE id = @id
      `);
    
    await AuditLog.log('DELETE_TEAM', req.user?.id, { 
      teamId: parseInt(id)
    });
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除团队失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除团队失败',
      error: error.message
    });
  }
};

// 将用户分配到团队
const assignUserToTeam = async (req, res) => {
  try {
    const { userId, teamId } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('teamId', sql.Int, teamId)
      .input('updated_by', sql.Int, req.user?.id)
      .query(`
        UPDATE sys_users SET
          team_id = @teamId,
          updated_by = @updated_by,
          updated_at = GETDATE()
        WHERE id = @userId
      `);
    
    // 更新团队人数
    await pool.request()
      .input('teamId', sql.Int, teamId)
      .query(`
        UPDATE sys_teams SET
          current_staff = (
            SELECT COUNT(*) FROM sys_users WHERE team_id = @teamId AND status = 'active'
          )
        WHERE id = @teamId
      `);
    
    await AuditLog.log('ASSIGN_USER_TEAM', req.user?.id, { 
      userId,
      teamId
    });
    
    res.json({
      success: true,
      message: '分配成功'
    });
  } catch (error) {
    console.error('分配用户到团队失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '分配用户到团队失败',
      error: error.message
    });
  }
};

// 获取团队的成员
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('teamId', sql.Int, teamId)
      .query(`
        SELECT u.id, u.employee_no, u.name, u.position, u.email, u.phone
        FROM sys_users u
        WHERE u.team_id = @teamId AND u.status = 'active'
        ORDER BY u.name
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('获取团队成员失败:', error);
    res.status(500).json({ success: false, message: '获取团队成员失败' });
  }
};

// 获取组织树（包含部门、小组、人员）
const getOrganizationTree = async (req, res) => {
  try {
    const pool = await getPool();

    // 获取所有部门
    const deptsResult = await pool.request()
      .query(`
        SELECT * FROM sys_departments
        WHERE status = 'active'
        ORDER BY sort_order, id
      `);

    // 获取所有团队
    const teamsResult = await pool.request()
      .query(`
        SELECT t.*, d.name as department_name
        FROM sys_teams t
        LEFT JOIN sys_departments d ON t.department_id = d.id
        WHERE t.status = 'active'
        ORDER BY t.sort_order, t.id
      `);

    // 获取所有用户
    const usersResult = await pool.request()
      .query(`
        SELECT u.id, u.name, u.position, u.gender, u.join_date, u.department_id, u.team_id, u.employee_no, u.role, u.permissions, u.data_permission
        FROM sys_users u
        WHERE u.status = 'active'
        ORDER BY u.department_id, u.name
      `);

    const departments = deptsResult.recordset;
    const teams = teamsResult.recordset;
    const users = usersResult.recordset;

    // 构建树形结构
    const buildTree = () => {
      const result = [];

      // 添加公司根节点
      result.push({
        id: 0,
        name: '曼弗莱德智能制造',
        type: 'company',
        children: []
      });

      // 添加部门
      departments.filter(d => d.parent_id === null || d.parent_id === 0).forEach(dept => {
        const deptNode = {
          id: `dept_${dept.id}`,
          name: dept.name,
          type: 'department',
          departmentId: dept.id,
          department_code: dept.department_code || '',
          manager: dept.manager || '',
          headcount: dept.headcount || 0,
          icon: dept.icon || 'fa fa-building',
          color: dept.color || '#165DFF',
          children: []
        };

        // 递归添加团队及其成员
        const addTeamWithMembers = (team, parentNode) => {
          const teamNode = {
            id: `team_${team.id}`,
            name: team.name,
            type: 'team',
            teamId: team.id,
            leaderId: team.leader_id,
            departmentId: dept.id,
            children: []
          };

          // 添加该团队的成员
          users.filter(u => u.team_id === team.id).forEach(user => {
            teamNode.children.push({
              id: `user_${user.id}`,
              name: user.name,
              type: 'user',
              userId: user.id,
              employee_no: user.employee_no,
              position: user.position,
              gender: user.gender,
              join_date: user.join_date,
              role: user.role,
              permissions: user.permissions ? JSON.parse(user.permissions) : {},
              data_permission: user.data_permission ? JSON.parse(user.data_permission) : null
            });
          });

          // 递归添加子团队
          teams.filter(t => t.parent_team_id === team.id).forEach(childTeam => {
            addTeamWithMembers(childTeam, teamNode);
          });

          parentNode.children.push(teamNode);
        };

        // 添加顶级团队（没有父小组的团队）
        teams.filter(t => t.department_id === dept.id && (t.parent_team_id === null || t.parent_team_id === 0)).forEach(team => {
          addTeamWithMembers(team, deptNode);
        });

        // 添加没有团队的用户
        const deptUsersWithoutTeam = users.filter(u =>
          u.department_id === dept.id &&
          u.team_id === null
        );
        deptUsersWithoutTeam.forEach(user => {
          deptNode.children.push({
            id: `user_${user.id}`,
            name: user.name,
            type: 'user',
            userId: user.id,
            employee_no: user.employee_no,
            position: user.position,
            gender: user.gender,
            join_date: user.join_date,
            role: user.role,
            permissions: user.permissions ? JSON.parse(user.permissions) : {},
            data_permission: user.data_permission ? JSON.parse(user.data_permission) : null
          });
        });

        result[0].children.push(deptNode);
      });

      return result;
    };

    res.json({
      success: true,
      data: buildTree()
    });
  } catch (error) {
    console.error('获取组织树失败:', error);
    res.status(500).json({ success: false, message: '获取组织树失败' });
  }
};

// 更新团队成员数
const updateTeamCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_staff } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('current_staff', sql.Int, current_staff)
      .query(`
        UPDATE sys_teams
        SET current_staff = @current_staff,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新团队成员数失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
};

module.exports = {
  router,
  getAllTeams,
  getTeamsByDepartment,
  createTeam,
  updateTeam,
  deleteTeam,
  assignUserToTeam,
  getTeamMembers,
  getOrganizationTree,
  updateTeamCount
};
