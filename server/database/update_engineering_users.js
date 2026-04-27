const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateEngineeringUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Engineering Department users...');

    // 查找工程部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%工程%'");

    console.log('Engineering departments:', deptResult.recordset);

    let engineeringDeptId;
    if (deptResult.recordset.length === 0) {
      console.log('Engineering department not found, creating...');
      // 创建工程部
      const createDeptResult = await pool.request()
        .input('department_code', sql.NVarChar, 'DEPT_ENGINEERING')
        .input('name', sql.NVarChar, '工程部')
        .input('headcount', sql.Int, 60)
        .input('current_staff', sql.Int, 55)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_departments (department_code, name, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@department_code, @name, @headcount, @current_staff, @status, GETDATE())
        `);
      engineeringDeptId = createDeptResult.recordset[0].id;
      console.log('Created engineering department, ID:', engineeringDeptId);
    } else {
      engineeringDeptId = deptResult.recordset[0].id;
      console.log('Engineering department ID:', engineeringDeptId);
    }

    // 创建工艺开发部小组
    const processTeamResult = await pool.request()
      .input('name', sql.NVarChar, '工艺开发部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let processTeamId;
    if (processTeamResult.recordset.length > 0) {
      processTeamId = processTeamResult.recordset[0].id;
      console.log('Process team already exists, ID:', processTeamId);
    } else {
      const createProcessResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_PROCESS')
        .input('name', sql.NVarChar, '工艺开发部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 3)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      processTeamId = createProcessResult.recordset[0].id;
      console.log('Created process team, ID:', processTeamId);
    }

    // 创建生产部小组
    const productionTeamResult = await pool.request()
      .input('name', sql.NVarChar, '生产部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let productionTeamId;
    if (productionTeamResult.recordset.length > 0) {
      productionTeamId = productionTeamResult.recordset[0].id;
      console.log('Production team already exists, ID:', productionTeamId);
    } else {
      const createProductionResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_PRODUCTION')
        .input('name', sql.NVarChar, '生产部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('headcount', sql.Int, 30)
        .input('current_staff', sql.Int, 28)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      productionTeamId = createProductionResult.recordset[0].id;
      console.log('Created production team, ID:', productionTeamId);
    }

    // 创建生产计划部子小组
    const planTeamResult = await pool.request()
      .input('name', sql.NVarChar, '生产计划部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let planTeamId;
    if (planTeamResult.recordset.length > 0) {
      planTeamId = planTeamResult.recordset[0].id;
      console.log('Plan team already exists, ID:', planTeamId);
    } else {
      const createPlanResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_PLAN')
        .input('name', sql.NVarChar, '生产计划部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('parent_team_id', sql.Int, productionTeamId)
        .input('headcount', sql.Int, 2)
        .input('current_staff', sql.Int, 1)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      planTeamId = createPlanResult.recordset[0].id;
      console.log('Created plan team, ID:', planTeamId);
    }

    // 创建厂内生产部子小组
    const factoryTeamResult = await pool.request()
      .input('name', sql.NVarChar, '厂内生产部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let factoryTeamId;
    if (factoryTeamResult.recordset.length > 0) {
      factoryTeamId = factoryTeamResult.recordset[0].id;
      console.log('Factory team already exists, ID:', factoryTeamId);
    } else {
      const createFactoryResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_FACTORY')
        .input('name', sql.NVarChar, '厂内生产部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('parent_team_id', sql.Int, productionTeamId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 4)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      factoryTeamId = createFactoryResult.recordset[0].id;
      console.log('Created factory team, ID:', factoryTeamId);
    }

    // 创建工程安装部子小组
    const installTeamResult = await pool.request()
      .input('name', sql.NVarChar, '工程安装部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let installTeamId;
    if (installTeamResult.recordset.length > 0) {
      installTeamId = installTeamResult.recordset[0].id;
      console.log('Install team already exists, ID:', installTeamId);
    } else {
      const createInstallResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_INSTALL')
        .input('name', sql.NVarChar, '工程安装部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('parent_team_id', sql.Int, productionTeamId)
        .input('headcount', sql.Int, 25)
        .input('current_staff', sql.Int, 23)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      installTeamId = createInstallResult.recordset[0].id;
      console.log('Created install team, ID:', installTeamId);
    }

    // 创建工程调试部小组
    const debugTeamResult = await pool.request()
      .input('name', sql.NVarChar, '工程调试部')
      .input('department_id', sql.Int, engineeringDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let debugTeamId;
    if (debugTeamResult.recordset.length > 0) {
      debugTeamId = debugTeamResult.recordset[0].id;
      console.log('Debug team already exists, ID:', debugTeamId);
    } else {
      const createDebugResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_ENG_DEBUG')
        .input('name', sql.NVarChar, '工程调试部')
        .input('department_id', sql.Int, engineeringDeptId)
        .input('headcount', sql.Int, 26)
        .input('current_staff', sql.Int, 24)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      debugTeamId = createDebugResult.recordset[0].id;
      console.log('Created debug team, ID:', debugTeamId);
    }

    // 定义工程部人员（根据图片中的真实数据）
    const users = [
      // 工艺开发部人员 (3人)
      { name: '李辉', position: '工艺开发主管', teamId: processTeamId, isLeader: true },
      { name: '徐以东', position: '调试主管', teamId: processTeamId },
      { name: '邓义龙', position: '调试工程师', teamId: processTeamId },

      // 生产计划部人员 (1人)
      { name: '蔡振月', position: '计划主管', teamId: planTeamId, isLeader: true },

      // 厂内生产部人员 (4人)
      { name: '夏良', position: '生产主管', teamId: factoryTeamId, isLeader: true },
      { name: '雷庆辉', position: '钳工', teamId: factoryTeamId },
      { name: '张力力', position: '生产组长', teamId: factoryTeamId },
      { name: '姜科', position: '电工', teamId: factoryTeamId },

      // 工程安装部人员 (23人 - 根据图片)
      { name: '李培兵', position: '工程经理', teamId: installTeamId, isLeader: true },
      { name: '赵怀友', position: '钳工', teamId: installTeamId },
      { name: '龙焱文', position: '电工', teamId: installTeamId },
      { name: '蒋文平', position: '钳工', teamId: installTeamId },
      { name: '任高辉', position: '钳工', teamId: installTeamId },
      { name: '王兴超', position: '电工', teamId: installTeamId },
      { name: '张云腾', position: '钳工', teamId: installTeamId },
      { name: '吴松', position: '现场经理', teamId: installTeamId },
      { name: '刘恩万', position: '钳工', teamId: installTeamId },
      { name: '翟修涛', position: '钳工', teamId: installTeamId },
      { name: '王亮', position: '电工', teamId: installTeamId },
      { name: '赵学忠', position: '电工', teamId: installTeamId },
      { name: '张炳州', position: '电工', teamId: installTeamId },
      { name: '王东雨', position: '钳工', teamId: installTeamId },
      { name: '张明凯', position: '电工', teamId: installTeamId },
      { name: '张亮', position: '电工', teamId: installTeamId },
      { name: '樊建峰', position: '钳工', teamId: installTeamId },
      { name: '徐广波', position: '现场经理', teamId: installTeamId },
      { name: '杨忠雷', position: '现场经理', teamId: installTeamId },
      { name: '姬华峰', position: '现场经理', teamId: installTeamId },
      { name: '吕国军', position: '钳工', teamId: installTeamId },
      { name: '李继连', position: '现场经理', teamId: installTeamId },
      { name: '王建', position: '钳工', teamId: installTeamId },

      // 工程调试部人员 (24人 - 根据图片)
      { name: '王向银', position: '调试主管', teamId: debugTeamId, isLeader: true },
      { name: '曹文远', position: '调试工程师', teamId: debugTeamId },
      { name: '钱浩', position: '调试工程师', teamId: debugTeamId },
      { name: '於中华', position: '调试工程师', teamId: debugTeamId },
      { name: '戴景元', position: '调试工程师', teamId: debugTeamId },
      { name: '涂洪峰', position: '调试工程师', teamId: debugTeamId },
      { name: '章超', position: '调试工程师', teamId: debugTeamId },
      { name: '张金旭', position: '调试工程师', teamId: debugTeamId },
      { name: '吕广政', position: '调试工程师', teamId: debugTeamId },
      { name: '王子祥', position: '调试工程师', teamId: debugTeamId },
      { name: '何大海', position: '调试工程师', teamId: debugTeamId },
      { name: '陆新洁', position: '调试工程师', teamId: debugTeamId },
      { name: '孙吉伟', position: '调试工程师', teamId: debugTeamId },
      { name: '戴支文', position: '调试工程师', teamId: debugTeamId },
      { name: '梁志', position: '调试工程师', teamId: debugTeamId },
      { name: '陈明杰', position: '调试工程师', teamId: debugTeamId },
      { name: '胡道鑫', position: '调试工程师', teamId: debugTeamId },
      { name: '张滨', position: '调试工程师', teamId: debugTeamId },
      { name: '王震', position: '现场经理', teamId: debugTeamId },
      { name: '夏前锦', position: '调试工程师', teamId: debugTeamId },
      { name: '梁振杰', position: '调试工程师', teamId: debugTeamId },
      { name: '郑宇龙', position: '调试工程师', teamId: debugTeamId },
      { name: '潘世先', position: '调试工程师', teamId: debugTeamId },
      { name: '高鹦', position: '调试工程师', teamId: debugTeamId },

      // 未分组人员
      { name: '李培兵', position: '工程经理', teamId: null, isLeader: true }
    ];

    // 更新或插入人员数据
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const username = 'eng2_' + (i + 1).toString().padStart(3, '0');

      // 检查用户是否已存在
      const userResult = await pool.request()
        .input('name', sql.NVarChar, user.name)
        .query('SELECT id FROM sys_users WHERE name = @name');

      if (userResult.recordset.length > 0) {
        // 更新现有用户
        const userId = userResult.recordset[0].id;
        await pool.request()
          .input('id', sql.Int, userId)
          .input('department_id', sql.Int, engineeringDeptId)
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
          .input('department_id', sql.Int, engineeringDeptId)
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

    console.log('Engineering department users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating engineering users:', error);
    process.exit(1);
  }
}

updateEngineeringUsers();
