const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateBatteryUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Battery Department users...');

    // 查找电池事业部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%电池%'");

    console.log('Battery departments:', deptResult.recordset);

    let batteryDeptId;
    if (deptResult.recordset.length === 0) {
      console.log('Battery department not found, creating...');
      // 创建电池事业部
      const createDeptResult = await pool.request()
        .input('department_code', sql.NVarChar, 'DEPT_BATTERY')
        .input('name', sql.NVarChar, '电池事业部')
        .input('headcount', sql.Int, 30)
        .input('current_staff', sql.Int, 22)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_departments (department_code, name, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@department_code, @name, @headcount, @current_staff, @status, GETDATE())
        `);
      batteryDeptId = createDeptResult.recordset[0].id;
      console.log('Created battery department, ID:', batteryDeptId);
    } else {
      batteryDeptId = deptResult.recordset[0].id;
      console.log('Battery department ID:', batteryDeptId);
    }

    // 创建方案&机械设计部小组
    const designTeamResult = await pool.request()
      .input('name', sql.NVarChar, '方案&机械设计部')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let designTeamId;
    if (designTeamResult.recordset.length > 0) {
      designTeamId = designTeamResult.recordset[0].id;
      console.log('Design team already exists, ID:', designTeamId);
    } else {
      const createDesignResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_DESIGN')
        .input('name', sql.NVarChar, '方案&机械设计部')
        .input('department_id', sql.Int, batteryDeptId)
        .input('headcount', sql.Int, 20)
        .input('current_staff', sql.Int, 17)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      designTeamId = createDesignResult.recordset[0].id;
      console.log('Created design team, ID:', designTeamId);
    }

    // 创建销售部小组
    const salesTeamResult = await pool.request()
      .input('name', sql.NVarChar, '销售部')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let salesTeamId;
    if (salesTeamResult.recordset.length > 0) {
      salesTeamId = salesTeamResult.recordset[0].id;
      console.log('Sales team already exists, ID:', salesTeamId);
    } else {
      const createSalesResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_SALES')
        .input('name', sql.NVarChar, '销售部')
        .input('department_id', sql.Int, batteryDeptId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 3)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      salesTeamId = createSalesResult.recordset[0].id;
      console.log('Created sales team, ID:', salesTeamId);
    }

    // 创建电气设计部小组
    const elecTeamResult = await pool.request()
      .input('name', sql.NVarChar, '电气设计部')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let elecTeamId;
    if (elecTeamResult.recordset.length > 0) {
      elecTeamId = elecTeamResult.recordset[0].id;
      console.log('Electrical team already exists, ID:', elecTeamId);
    } else {
      const createElecResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_ELEC')
        .input('name', sql.NVarChar, '电气设计部')
        .input('department_id', sql.Int, batteryDeptId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 3)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      elecTeamId = createElecResult.recordset[0].id;
      console.log('Created electrical team, ID:', elecTeamId);
    }

    // 创建电池设计组（子小组）
    const batteryDesignResult = await pool.request()
      .input('name', sql.NVarChar, '电池设计组')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let batteryDesignId;
    if (batteryDesignResult.recordset.length > 0) {
      batteryDesignId = batteryDesignResult.recordset[0].id;
      console.log('Battery design team already exists, ID:', batteryDesignId);
    } else {
      const createBatteryDesignResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_DESIGN_1')
        .input('name', sql.NVarChar, '电池设计组')
        .input('department_id', sql.Int, batteryDeptId)
        .input('parent_team_id', sql.Int, designTeamId)
        .input('headcount', sql.Int, 12)
        .input('current_staff', sql.Int, 10)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      batteryDesignId = createBatteryDesignResult.recordset[0].id;
      console.log('Created battery design team, ID:', batteryDesignId);
    }

    // 创建电池回收方案组（子小组）
    const recycleTeamResult = await pool.request()
      .input('name', sql.NVarChar, '电池回收方案组')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let recycleTeamId;
    if (recycleTeamResult.recordset.length > 0) {
      recycleTeamId = recycleTeamResult.recordset[0].id;
      console.log('Recycle team already exists, ID:', recycleTeamId);
    } else {
      const createRecycleResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_RECYCLE')
        .input('name', sql.NVarChar, '电池回收方案组')
        .input('department_id', sql.Int, batteryDeptId)
        .input('parent_team_id', sql.Int, designTeamId)
        .input('headcount', sql.Int, 3)
        .input('current_staff', sql.Int, 2)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      recycleTeamId = createRecycleResult.recordset[0].id;
      console.log('Created recycle team, ID:', recycleTeamId);
    }

    // 创建电池产线方案组（子小组）
    const lineTeamResult = await pool.request()
      .input('name', sql.NVarChar, '电池产线方案组')
      .input('department_id', sql.Int, batteryDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let lineTeamId;
    if (lineTeamResult.recordset.length > 0) {
      lineTeamId = lineTeamResult.recordset[0].id;
      console.log('Line team already exists, ID:', lineTeamId);
    } else {
      const createLineResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_BATTERY_LINE')
        .input('name', sql.NVarChar, '电池产线方案组')
        .input('department_id', sql.Int, batteryDeptId)
        .input('parent_team_id', sql.Int, designTeamId)
        .input('headcount', sql.Int, 5)
        .input('current_staff', sql.Int, 4)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, parent_team_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @parent_team_id, @headcount, @current_staff, @status, GETDATE())
        `);
      lineTeamId = createLineResult.recordset[0].id;
      console.log('Created line team, ID:', lineTeamId);
    }

    // 定义电池事业部人员（根据图片中的真实数据）
    const users = [
      // 电池设计组人员 (10人)
      { name: '白钢', position: '电池设计主管', teamId: batteryDesignId, isLeader: true },
      { name: '胡成怀', position: '机械工程师', teamId: batteryDesignId },
      { name: '魏通彤', position: '机械工程师', teamId: batteryDesignId },
      { name: '王宁', position: '机械工程师', teamId: batteryDesignId },
      { name: '曹亚林', position: '机械工程师', teamId: batteryDesignId },
      { name: '叶昱麟', position: '助理工程师', teamId: batteryDesignId },
      { name: '段源', position: '机械工程师', teamId: batteryDesignId },
      { name: '章丽', position: '机械工程师', teamId: batteryDesignId },
      { name: '刘科峰', position: '机械工程师', teamId: batteryDesignId },
      { name: '张鹏', position: '机械工程师', teamId: batteryDesignId },

      // 电池回收方案组人员 (2人)
      { name: '张益汉', position: '电池回收方案主管', teamId: recycleTeamId, isLeader: true },
      { name: '吴洪平', position: '机械工程师', teamId: recycleTeamId },

      // 电池产线方案组人员 (4人)
      { name: '吴飞', position: '电池产线方案主管', teamId: lineTeamId, isLeader: true },
      { name: '徐茂', position: '机械工程师', teamId: lineTeamId },
      { name: '方云岚', position: '机械工程师', teamId: lineTeamId },
      { name: '魏丛文', position: '机械工程师', teamId: lineTeamId },

      // 销售部人员 (3人)
      { name: '刘建涛', position: '销售总监', teamId: salesTeamId, isLeader: true },
      { name: '马志乐', position: '销售总监', teamId: salesTeamId },
      { name: '徐八', position: '销售经理', teamId: salesTeamId },

      // 电气设计部人员 (3人)
      { name: '庞春元', position: '电气设计主管', teamId: elecTeamId, isLeader: true },
      { name: '张安龙', position: '电气工程师', teamId: elecTeamId },
      { name: '岳权', position: '电气工程师', teamId: elecTeamId },

      // 未分组人员 - 事业部总经理
      { name: '秦海军', position: '事业部总经理', teamId: null, isLeader: true }
    ];

    // 更新或插入人员数据
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const username = 'batt_' + (i + 1).toString().padStart(3, '0');

      // 检查用户是否已存在
      const userResult = await pool.request()
        .input('name', sql.NVarChar, user.name)
        .query('SELECT id FROM sys_users WHERE name = @name');

      if (userResult.recordset.length > 0) {
        // 更新现有用户
        const userId = userResult.recordset[0].id;
        await pool.request()
          .input('id', sql.Int, userId)
          .input('department_id', sql.Int, batteryDeptId)
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
          .input('department_id', sql.Int, batteryDeptId)
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

    console.log('Battery department users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating battery users:', error);
    process.exit(1);
  }
}

updateBatteryUsers();
