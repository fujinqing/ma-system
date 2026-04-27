const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateSupplyChainUsers() {
  const pool = await getPool();

  try {
    console.log('Updating Supply Chain Department users...');

    // 查找供应链管理部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%供应链%'");

    console.log('Supply Chain departments:', deptResult.recordset);

    let supplyChainDeptId;
    if (deptResult.recordset.length === 0) {
      console.log('Supply Chain department not found, creating...');
      // 创建供应链管理部
      const createDeptResult = await pool.request()
        .input('department_code', sql.NVarChar, 'DEPT_SUPPLY_CHAIN')
        .input('name', sql.NVarChar, '供应链管理部')
        .input('headcount', sql.Int, 15)
        .input('current_staff', sql.Int, 12)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_departments (department_code, name, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@department_code, @name, @headcount, @current_staff, @status, GETDATE())
        `);
      supplyChainDeptId = createDeptResult.recordset[0].id;
      console.log('Created supply chain department, ID:', supplyChainDeptId);
    } else {
      supplyChainDeptId = deptResult.recordset[0].id;
      console.log('Supply Chain department ID:', supplyChainDeptId);
    }

    // 创建仓库部小组
    const warehouseTeamResult = await pool.request()
      .input('name', sql.NVarChar, '仓库部')
      .input('department_id', sql.Int, supplyChainDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let warehouseTeamId;
    if (warehouseTeamResult.recordset.length > 0) {
      warehouseTeamId = warehouseTeamResult.recordset[0].id;
      console.log('Warehouse team already exists, ID:', warehouseTeamId);
    } else {
      const createWarehouseResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_SC_WAREHOUSE')
        .input('name', sql.NVarChar, '仓库部')
        .input('department_id', sql.Int, supplyChainDeptId)
        .input('headcount', sql.Int, 6)
        .input('current_staff', sql.Int, 5)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      warehouseTeamId = createWarehouseResult.recordset[0].id;
      console.log('Created warehouse team, ID:', warehouseTeamId);
    }

    // 创建采购&物流部小组
    const purchaseTeamResult = await pool.request()
      .input('name', sql.NVarChar, '采购&物流部')
      .input('department_id', sql.Int, supplyChainDeptId)
      .query('SELECT id FROM sys_teams WHERE name = @name AND department_id = @department_id');

    let purchaseTeamId;
    if (purchaseTeamResult.recordset.length > 0) {
      purchaseTeamId = purchaseTeamResult.recordset[0].id;
      console.log('Purchase team already exists, ID:', purchaseTeamId);
    } else {
      const createPurchaseResult = await pool.request()
        .input('team_code', sql.NVarChar, 'TEAM_SC_PURCHASE')
        .input('name', sql.NVarChar, '采购&物流部')
        .input('department_id', sql.Int, supplyChainDeptId)
        .input('headcount', sql.Int, 8)
        .input('current_staff', sql.Int, 6)
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO sys_teams (team_code, name, department_id, headcount, current_staff, status, created_at)
          OUTPUT INSERTED.id
          VALUES (@team_code, @name, @department_id, @headcount, @current_staff, @status, GETDATE())
        `);
      purchaseTeamId = createPurchaseResult.recordset[0].id;
      console.log('Created purchase team, ID:', purchaseTeamId);
    }

    // 定义供应链管理部人员（根据图片中的真实数据）
    const users = [
      // 仓库部人员 (5人)
      { name: '张应龙', position: '仓库经理', teamId: warehouseTeamId, isLeader: true },
      { name: '张杰', position: '仓管员', teamId: warehouseTeamId },
      { name: '赵成成', position: '仓管员', teamId: warehouseTeamId },
      { name: '李超', position: '仓管员', teamId: warehouseTeamId },
      { name: '马少娜', position: '实习生', teamId: warehouseTeamId },

      // 采购&物流部人员 (6人)
      { name: '孔子娟', position: '供应链经理', teamId: purchaseTeamId, isLeader: true },
      { name: '孙秀丽', position: '采购工程师', teamId: purchaseTeamId },
      { name: '徐美珠', position: '采购工程师', teamId: purchaseTeamId },
      { name: '王碧肖', position: '采购工程师', teamId: purchaseTeamId },
      { name: '张慧敏', position: '采购工程师', teamId: purchaseTeamId },
      { name: '袁明杰', position: '物流专员', teamId: purchaseTeamId },

      // 未分组人员
      { name: '孔子娟', position: '供应链经理', teamId: null, isLeader: true },
      { name: '方雯', position: '市场 & 海外营销经理', teamId: null, isLeader: true }
    ];

    // 更新或插入人员数据
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const username = 'sc_' + (i + 1).toString().padStart(3, '0');

      // 检查用户是否已存在
      const userResult = await pool.request()
        .input('name', sql.NVarChar, user.name)
        .query('SELECT id FROM sys_users WHERE name = @name');

      if (userResult.recordset.length > 0) {
        // 更新现有用户
        const userId = userResult.recordset[0].id;
        await pool.request()
          .input('id', sql.Int, userId)
          .input('department_id', sql.Int, supplyChainDeptId)
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
          .input('department_id', sql.Int, supplyChainDeptId)
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

    console.log('Supply Chain department users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating supply chain users:', error);
    process.exit(1);
  }
}

updateSupplyChainUsers();
