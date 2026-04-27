const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateProjectUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Project department users...');

    // 查找项目部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%项目%'");
    
    console.log('Project departments:', deptResult.recordset);

    if (deptResult.recordset.length === 0) {
      console.log('Project department not found');
      process.exit(1);
    }

    const projectDeptId = deptResult.recordset[0].id;
    console.log('Project department ID:', projectDeptId);

    // 创建电池项目部小组
    const teamResult = await pool.request()
      .input('name', sql.NVarChar, '电池项目部')
      .input('department_id', sql.Int, projectDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let batteryTeamId;
    if (teamResult.recordset.length > 0) {
      batteryTeamId = teamResult.recordset[0].id;
      console.log('Battery team already exists, ID:', batteryTeamId);
    } else {
      // 创建新小组
      const createTeamResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY')
        .input('name', sql.NVarChar, '电池项目部')
        .input('department_id', sql.Int, projectDeptId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 2)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      batteryTeamId = createTeamResult.recordset[0].id;
      console.log('Created battery team, ID:', batteryTeamId);
    }

    // 更新或插入人员数据
    const users = [
      { name: '毕照卫', position: '项目部经理', isLeader: true },
      { name: '邸维龙', position: '项目经理' },
      { name: '余臣', position: '项目经理' },
      { name: '王冰冰', position: '项目经理' },
      { name: '刘培', position: '项目经理' },
      { name: '朱凯', position: '项目经理' },
      { name: '吕科润', position: '项目经理', teamId: batteryTeamId },
      { name: '周强', position: '项目经理', teamId: batteryTeamId }
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
          .input('department_id', sql.Int, projectDeptId)
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
          .input('department_id', sql.Int, projectDeptId)
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
      .input('dept_id', sql.Int, projectDeptId)
      .query(`
        SELECT u.id, u.name, u.position, u.team_id, t.name as team_name, d.name as department_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.department_id = @dept_id AND u.status = 'active'
        ORDER BY u.team_id, u.id
      `);

    console.log('\nUpdated Project users:');
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

updateProjectUsers();
