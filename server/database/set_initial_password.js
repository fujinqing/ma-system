/**
 * 为所有用户设置初始密码123456
 */

const { getPool } = require('../config/database');
const bcrypt = require('bcrypt');

async function setInitialPassword() {
  try {
    const pool = await getPool();
    console.log('开始为所有用户设置初始密码...');

    // 获取所有活跃用户
    const usersResult = await pool.request().query(`
      SELECT id, employee_no, name 
      FROM sys_users 
      WHERE status = 'active'
    `);

    const users = usersResult.recordset;
    console.log(`找到 ${users.length} 位活跃用户`);

    let updatedCount = 0;
    for (const user of users) {
      // 生成密码哈希
      const passwordHash = await bcrypt.hash('123456', 10);

      // 更新密码
      await pool.request()
        .input('password_hash', passwordHash)
        .input('id', user.id)
        .query(`
          UPDATE sys_users 
          SET password_hash = @password_hash 
          WHERE id = @id
        `);

      console.log(`✅ 更新成功: ${user.name} (工号: ${user.employee_no || '无'})`);
      updatedCount++;
    }

    console.log(`\n密码更新完成！成功更新 ${updatedCount}/${users.length} 位用户`);
    console.log('初始密码统一为: 123456');

    process.exit(0);
  } catch (error) {
    console.error('设置初始密码失败:', error);
    process.exit(1);
  }
}

setInitialPassword();
