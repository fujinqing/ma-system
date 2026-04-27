const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateCastingUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Casting Department users...');

    // 查找铸造事业部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%铸造%'");

    console.log('Casting departments:', deptResult.recordset);

    if (deptResult.recordset.length === 0) {
      console.log('Casting department not found');
      process.exit(1);
    }

    const castingDeptId = deptResult.recordset[0].id;
    console.log('Casting department ID:', castingDeptId);

    // 创建技术部小组
    const techTeamResult = await pool.request()
      .input('name', sql.NVarChar, '技术部')
      .input('department_id', sql.Int, castingDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let techTeamId;
    if (techTeamResult.recordset.length > 0) {
      techTeamId = techTeamResult.recordset[0].id;
      console.log('Tech team already exists, ID:', techTeamId);
    } else {
      const createTechResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_CAST_TECH')
        .input('name', sql.NVarChar, '技术部')
        .input('department_id', sql.Int, castingDeptId)
        .input('headcount', sql.Int, 10)
        .input('current_staff', sql.Int, 9)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      techTeamId = createTechResult.recordset[0].id;
      console.log('Created tech team, ID:', techTeamId);
    }

    // 创建项目部小组
    const projTeamResult = await pool.request()
      .input('name', sql.NVarChar, '项目部')
      .input('department_id', sql.Int, castingDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let projTeamId;
    if (projTeamResult.recordset.length > 0) {
      projTeamId = projTeamResult.recordset[0].id;
      console.log('Project team already exists, ID:', projTeamId);
    } else {
      const createProjResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_CAST_PROJ')
        .input('name', sql.NVarChar, '项目部')
        .input('department_id', sql.Int, castingDeptId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 3)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      projTeamId = createProjResult.recordset[0].id;
      console.log('Created project team, ID:', projTeamId);
    }

    // 创建客户服务部小组
    const serviceTeamResult = await pool.request()
      .input('name', sql.NVarChar, '客户服务部')
      .input('department_id', sql.Int, castingDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let serviceTeamId;
    if (serviceTeamResult.recordset.length > 0) {
      serviceTeamId = serviceTeamResult.recordset[0].id;
      console.log('Service team already exists, ID:', serviceTeamId);
    } else {
      const createServiceResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_CAST_SERVICE')
        .input('name', sql.NVarChar, '客户服务部')
        .input('department_id', sql.Int, castingDeptId)
        .input('headcount', sql.Int, 10)
        .input('current_staff', sql.Int, 7)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      serviceTeamId = createServiceResult.recordset[0].id;
      console.log('Created service team, ID:', serviceTeamId);
    }

    // 定义铸造事业部人员
    const users = [
      // 技术部人员 (9人)
      { name: '李涛', position: '技术部经理', teamId: techTeamId, isLeader: true },
      { name: '钱晶晶', position: '电气工程师', teamId: techTeamId },
      { name: '陈坤', position: '机械工程师', teamId: techTeamId },
      { name: '吴昊', position: '机械工程师', teamId: techTeamId },
      { name: '樊海平', position: '机械工程师', teamId: techTeamId },
      { name: '刘国良', position: '机械工程师', teamId: techTeamId },
      { name: '胡鸿志', position: '机械工程师', teamId: techTeamId },
      { name: '吕绍华', position: '机械工程师', teamId: techTeamId },
      { name: '倪德超', position: '机械工程师', teamId: techTeamId },

      // 项目部人员 (3人)
      { name: '孙仙亮', position: '客户服务部经理', teamId: projTeamId, isLeader: true },
      { name: '刘将', position: '项目经理', teamId: projTeamId },
      { name: '李琪', position: '项目工程师', teamId: projTeamId },

      // 客户服务部人员 (7人)
      { name: '孙仙亮', position: '客户服务部经理', teamId: serviceTeamId, isLeader: true },
      { name: '张永明', position: '服务工程师', teamId: serviceTeamId },
      { name: '雷雨田', position: '服务工程师', teamId: serviceTeamId },
      { name: '熊鹏飞', position: '服务工程师', teamId: serviceTeamId },
      { name: '叶泳兵', position: '服务工程师', teamId: serviceTeamId },
      { name: '杨晓峰', position: '服务工程师', teamId: serviceTeamId },
      { name: '赵嘉鑫', position: '服务工程师', teamId: serviceTeamId },

      // 未分组人员 - 事业部总经理
      { name: '李海', position: '事业部总经理', teamId: null, isLeader: true }
    ];

    // 更新或插入人员数据
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const username = 'cast3_' + (i + 1).toString().padStart(3, '0');

      // 检查用户是否已存在
      const userResult = await pool.request()
        .input('name', sql.NVarChar, user.name)
        .query('SELECT id FROM sys_users WHERE name = @name');

      if (userResult.recordset.length > 0) {
        // 更新现有用户
        const userId = userResult.recordset[0].id;
        await pool.request()
          .input('id', sql.Int, userId)
          .input('department_id', sql.Int, castingDeptId)
          .input('team_id', sql.Int, user.teamId)
          .input('position', sql.NVarChar, user.position)
          .query(`
            UPDATE sys_users SET
              department_id = @department_id,
              team_id = @team_id,
              position = @position,
              updated_at = GETDATE()
            WHERE id = @id
          `);
        console.log(`Updated user: ${user.name} - ${user.position}`);
      } else {
        // 创建新用户（使用默认密码）
        const defaultPassword = '$2b$10$YourHashedPasswordHere'; // 默认密码哈希
        await pool.request()
          .input('username', sql.NVarChar, username)
          .input('name', sql.NVarChar, user.name)
          .input('password_hash', sql.NVarChar, defaultPassword)
          .input('department_id', sql.Int, castingDeptId)
          .input('team_id', sql.Int, user.teamId)
          .input('position', sql.NVarChar, user.position)
          .input('status', sql.NVarChar, 'active')
          .query(`
            INSERT INTO sys_users (username, name, password_hash, department_id, team_id, position, status, created_at)
            VALUES (@username, @name, @password_hash, @department_id, @team_id, @position, @status, GETDATE())
          `);
        console.log(`Created user: ${user.name} - ${user.position}`);
      }
    }

    console.log('Casting department users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating casting users:', error);
    process.exit(1);
  }
}

updateCastingUsers();
