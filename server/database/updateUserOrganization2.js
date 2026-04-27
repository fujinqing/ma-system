const db = require('../config/database');
const sql = db.sql;

async function updateUserOrganization2() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 人事行政部
    const hrDept = {
      department_id: 3, // 人事行政部
      users: [
        { employee_no: 237, name: '岳琦' }, // 岳雨
        { employee_no: 229, name: '孔子娟' } // 周美芳
      ]
    };

    // 财务&商务部
    const financeDept = {
      department_id: 4, // 财务&商务部
      users: [
        { employee_no: 190, name: '朱琳' }, // 财务经理
        { employee_no: 238, name: '周瑜' }, // 往来会计
        { employee_no: 187, name: '游剑峰' }, // 信息技术工程师
        { employee_no: 244, name: '王碧肖' }, // 黄楠？
        { employee_no: 184, name: '孙秀丽' } // 胡晨宇？
      ]
    };

    let updatedCount = 0;

    // 更新人事行政部
    console.log('=== 更新人事行政部 ===');
    for (const user of hrDept.users) {
      const result = await pool.request()
        .input('employee_no', sql.Int, user.employee_no)
        .input('department_id', sql.Int, hrDept.department_id)
        .input('team_id', sql.Int, null) // 没有小组
        .query(`
          UPDATE sys_users
          SET department_id = @department_id,
              team_id = @team_id
          WHERE employee_no = @employee_no AND status = 'active'
        `);

      if (result.rowsAffected[0] > 0) {
        updatedCount++;
        console.log(`✅ 更新用户: ${user.name} (工号: ${user.employee_no}) -> 人事行政部`);
      } else {
        console.log(`❌ 未找到用户: ${user.name} (工号: ${user.employee_no})`);
      }
    }

    // 更新财务&商务部
    console.log('\n=== 更新财务&商务部 ===');
    for (const user of financeDept.users) {
      const result = await pool.request()
        .input('employee_no', sql.Int, user.employee_no)
        .input('department_id', sql.Int, financeDept.department_id)
        .input('team_id', sql.Int, 4) // 财务部
        .query(`
          UPDATE sys_users
          SET department_id = @department_id,
              team_id = @team_id
          WHERE employee_no = @employee_no AND status = 'active'
        `);

      if (result.rowsAffected[0] > 0) {
        updatedCount++;
        console.log(`✅ 更新用户: ${user.name} (工号: ${user.employee_no}) -> 财务&商务部`);
      } else {
        console.log(`❌ 未找到用户: ${user.name} (工号: ${user.employee_no})`);
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
      WHERE u.employee_no IN (237, 229, 190, 238, 187, 244, 184) AND u.status = 'active'
    `);

    console.table(verifyResult.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

updateUserOrganization2();
