const db = require('../config/database');
const sql = db.sql;

// 组织架构数据 - 质量安全部
const qualitySafetyDept = {
  department_id: 1, // 质量安全部
  teams: [
    {
      team_id: 1, // 质量组
      name: '质量组',
      users: [
        { employee_no: 90, name: '张明明' },
        { employee_no: 271, name: '金仕琳' }
      ]
    },
    {
      team_id: 2, // 安全组
      name: '安全组',
      users: [
        { employee_no: 270, name: '潘佳' },
        { employee_no: 247, name: '管佳伟' }
      ]
    }
  ]
};

async function updateUserOrganization() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    let updatedCount = 0;

    // 更新质量安全部的用户
    console.log('=== 更新质量安全部用户 ===');
    
    for (const team of qualitySafetyDept.teams) {
      console.log(`\n处理小组: ${team.name}`);
      
      for (const user of team.users) {
        const result = await pool.request()
          .input('employee_no', sql.Int, user.employee_no)
          .input('department_id', sql.Int, qualitySafetyDept.department_id)
          .input('team_id', sql.Int, team.team_id)
          .query(`
            UPDATE sys_users
            SET department_id = @department_id,
                team_id = @team_id
            WHERE employee_no = @employee_no AND status = 'active'
          `);

        if (result.rowsAffected[0] > 0) {
          updatedCount++;
          console.log(`✅ 更新用户: ${user.name} (工号: ${user.employee_no}) -> ${team.name}`);
        } else {
          console.log(`❌ 未找到用户: ${user.name} (工号: ${user.employee_no})`);
        }
      }
    }

    console.log(`\n✅ 完成！成功更新 ${updatedCount} 个用户的组织架构`);

    // 验证更新结果
    console.log('\n=== 验证更新结果 ===');
    const verifyResult = await pool.request().query(`
      SELECT 
        u.employee_no AS '工号',
        u.name AS '姓名',
        d.name AS '部门',
        t.name AS '小组'
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      LEFT JOIN sys_teams t ON u.team_id = t.id
      WHERE u.employee_no IN (90, 271, 270, 247) AND u.status = 'active'
    `);

    console.table(verifyResult.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

updateUserOrganization();
