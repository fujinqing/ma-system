const { getPool } = require('../config/database');
const sql = require('mssql');

async function updatePVUsers() {
  const pool = await getPool();

  try {
    console.log('Updating PV Semiconductor department users...');

    // 查找光伏半导体事业部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%光伏%'");
    
    console.log('PV departments:', deptResult.recordset);

    if (deptResult.recordset.length === 0) {
      console.log('PV department not found');
      process.exit(1);
    }

    const pvDeptId = deptResult.recordset[0].id;
    console.log('PV department ID:', pvDeptId);

    // 创建技术部小组
    const techTeamResult = await pool.request()
      .input('name', sql.NVarChar, '技术部')
      .input('department_id', sql.Int, pvDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let techTeamId;
    if (techTeamResult.recordset.length > 0) {
      techTeamId = techTeamResult.recordset[0].id;
      console.log('Tech team already exists, ID:', techTeamId);
    } else {
      const createTechResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_TECH')
        .input('name', sql.NVarChar, '技术部')
        .input('department_id', sql.Int, pvDeptId)
        .input('headcount', sql.Int, 30)
        .input('current_staff', sql.Int, 21)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      techTeamId = createTechResult.recordset[0].id;
      console.log('Created tech team, ID:', techTeamId);
    }

    // 创建机械设计组小组
    const mechTeamResult = await pool.request()
      .input('name', sql.NVarChar, '机械设计组')
      .input('department_id', sql.Int, pvDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let mechTeamId;
    if (mechTeamResult.recordset.length > 0) {
      mechTeamId = mechTeamResult.recordset[0].id;
      console.log('Mech team already exists, ID:', mechTeamId);
    } else {
      const createMechResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_MECH')
        .input('name', sql.NVarChar, '机械设计组')
        .input('department_id', sql.Int, pvDeptId)
        .input('headcount', sql.Int, 20)
        .input('current_staff', sql.Int, 16)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      mechTeamId = createMechResult.recordset[0].id;
      console.log('Created mech team, ID:', mechTeamId);
    }

    // 创建销售部小组
    const salesTeamResult = await pool.request()
      .input('name', sql.NVarChar, '销售部')
      .input('department_id', sql.Int, pvDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let salesTeamId;
    if (salesTeamResult.recordset.length > 0) {
      salesTeamId = salesTeamResult.recordset[0].id;
      console.log('Sales team already exists, ID:', salesTeamId);
    } else {
      const createSalesResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_SALES')
        .input('name', sql.NVarChar, '销售部')
        .input('department_id', sql.Int, pvDeptId)
        .input('headcount', sql.Int, 10)
        .input('current_staff', sql.Int, 2)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      salesTeamId = createSalesResult.recordset[0].id;
      console.log('Created sales team, ID:', salesTeamId);
    }

    // 更新或插入人员数据
    const users = [
      // 未分组人员
      { name: '蒋东林', position: '技术部经理', isLeader: true },
      
      // 机械设计组1成员
      { name: '柴立桥', position: '机械设计组长', teamId: mechTeamId, isLeader: true },
      { name: '王守志', position: '机械工程师', teamId: mechTeamId },
      { name: '吴双', position: '机械工程师', teamId: mechTeamId },
      { name: '宋大鹏', position: '机械工程师', teamId: mechTeamId },
      
      // 机械设计组2成员
      { name: '张俊东', position: '机械设计组长', teamId: mechTeamId, isLeader: true },
      { name: '卢桥桥', position: '机械工程师', teamId: mechTeamId },
      { name: '吴晨', position: '机械工程师', teamId: mechTeamId },
      { name: '杨宇', position: '机械工程师', teamId: mechTeamId },
      
      // 机械设计组3成员
      { name: '崔岩', position: '机械设计组长', teamId: mechTeamId, isLeader: true },
      { name: '王辉', position: '机械工程师', teamId: mechTeamId },
      
      // 机械设计组4成员
      { name: '顾陆建', position: '机械设计组长', teamId: mechTeamId, isLeader: true },
      { name: '陈鑫', position: '机械工程师', teamId: mechTeamId },
      { name: '范伟骏', position: '助理工程师', teamId: mechTeamId },
      { name: '刘雪兵', position: '助理工程师', teamId: mechTeamId },
      { name: '蔡峰', position: '机械工程师', teamId: mechTeamId },
      
      // 电气设计组成员
      { name: '顾维国', position: '技术部主管', teamId: techTeamId, isLeader: true },
      { name: '岳清水', position: '电气设计主管', teamId: techTeamId, isLeader: true },
      { name: '刘九安', position: '电气工程师', teamId: techTeamId },
      { name: '刘金金', position: '电气工程师', teamId: techTeamId },
      { name: '李丹', position: '电气工程师', teamId: techTeamId },
      
      // 销售部成员
      { name: '傅晋涛', position: '事业部总经理', teamId: salesTeamId, isLeader: true },
      { name: '李喻燃', position: '销售经理', teamId: salesTeamId }
    ];

    for (const user of users) {
      // 检查用户是否存在
      const userResult = await pool.request()
        .input('name', sql.NVarChar, user.name)
        .query('SELECT id FROM sys_users WHERE name = @name');

      if (userResult.recordset.length > 0) {
        // 更新现有用户
        const userId = userResult.recordset[0].id;
        await pool.request()
          .input('id', sql.Int, userId)
          .input('position', sql.NVarChar, user.position)
          .input('department_id', sql.Int, pvDeptId)
          .input('team_id', sql.Int, user.teamId || null)
          .query(`
            UPDATE sys_users 
            SET position = @position, 
                department_id = @department_id,
                team_id = @team_id,
                updated_at = GETDATE()
            WHERE id = @id
          `);
        console.log(`Updated user: ${user.name} - ${user.position}`);
      } else {
        // 创建新用户
        const username = user.name.toLowerCase().replace(/\s/g, '');
        const defaultPassword = '123456';
        await pool.request()
          .input('username', sql.NVarChar, username)
          .input('name', sql.NVarChar, user.name)
          .input('position', sql.NVarChar, user.position)
          .input('department_id', sql.Int, pvDeptId)
          .input('team_id', sql.Int, user.teamId || null)
          .input('role', sql.NVarChar, 'employee')
          .input('status', sql.NVarChar, 'active')
          .input('password_hash', sql.NVarChar, defaultPassword)
          .query(`
            INSERT INTO sys_users (username, name, position, department_id, team_id, role, status, password_hash, created_at)
            VALUES (@username, @name, @position, @department_id, @team_id, @role, @status, @password_hash, GETDATE())
          `);
        console.log(`Created user: ${user.name} - ${user.position}`);
      }
    }

    // 验证更新结果
    const verifyResult = await pool.request()
      .input('dept_id', sql.Int, pvDeptId)
      .query(`
        SELECT u.id, u.name, u.position, u.team_id, t.name as team_name, d.name as department_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.department_id = @dept_id AND u.status = 'active'
        ORDER BY u.team_id, u.id
      `);

    console.log('\nUpdated PV Semiconductor users:');
    verifyResult.recordset.forEach(u => {
      const teamInfo = u.team_name ? ` [${u.team_name}]` : '';
      console.log(`  - ${u.name}: ${u.position}${teamInfo}`);
    });

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePVUsers();
