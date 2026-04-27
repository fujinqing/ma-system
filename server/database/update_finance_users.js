const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateFinanceUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Finance & Commerce department users...');

    // 查找财务&商务部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%财务%' OR name LIKE '%商务%'");
    
    console.log('Finance departments:', deptResult.recordset);

    if (deptResult.recordset.length === 0) {
      console.log('Finance department not found');
      process.exit(1);
    }

    const financeDeptId = deptResult.recordset[0].id;
    console.log('Finance department ID:', financeDeptId);

    // 创建财务部小组
    const teamResult = await pool.request()
      .input('name', sql.NVarChar, '财务部')
      .input('department_id', sql.Int, financeDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let financeTeamId;
    if (teamResult.recordset.length > 0) {
      financeTeamId = teamResult.recordset[0].id;
      console.log('Finance team already exists, ID:', financeTeamId);
    } else {
      // 创建新小组
      const createTeamResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_FINANCE')
        .input('name', sql.NVarChar, '财务部')
        .input('department_id', sql.Int, financeDeptId)
        .input('headcount', sql.Int, 10)
        .input('current_staff', sql.Int, 5)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      financeTeamId = createTeamResult.recordset[0].id;
      console.log('Created finance team, ID:', financeTeamId);
    }

    // 更新或插入人员数据
    const users = [
      { name: '陈云明', position: '财务&商务经理', isLeader: true },
      { name: '朱琳', position: '财务经理', teamId: financeTeamId, isLeader: true },
      { name: '黄楠', position: '出纳', teamId: financeTeamId },
      { name: '周琦', position: '往来会计', teamId: financeTeamId },
      { name: '游剑峰', position: '信息技术工程师', teamId: financeTeamId, isLeader: true },
      { name: '胡晨宇', position: '会计', teamId: financeTeamId }
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
          .input('department_id', sql.Int, financeDeptId)
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
          .input('department_id', sql.Int, financeDeptId)
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
      .input('dept_id', sql.Int, financeDeptId)
      .query(`
        SELECT u.id, u.name, u.position, u.team_id, t.name as team_name, d.name as department_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        LEFT JOIN sys_teams t ON u.team_id = t.id
        WHERE u.department_id = @dept_id AND u.status = 'active'
        ORDER BY u.team_id, u.id
      `);

    console.log('\nUpdated Finance & Commerce users:');
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

updateFinanceUsers();
