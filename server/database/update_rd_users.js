const { getPool } = require('../config/database');
const sql = require('mssql');

async function updateRDUsers() {
  const pool = await getPool();

  try {
    console.log('Updating R&D department users...');

    // 首先查找产品研发部的ID
    const deptResult = await pool.request()
      .query("SELECT id FROM sys_departments WHERE name LIKE '%研发%' OR name LIKE '%R&D%' OR name = '产品研发部'");
    
    console.log('R&D departments:', deptResult.recordset);

    if (deptResult.recordset.length === 0) {
      console.log('R&D department not found');
      process.exit(1);
    }

    const rdDeptId = deptResult.recordset[0].id;
    console.log('R&D department ID:', rdDeptId);

    // 更新或插入人员数据
    const users = [
      { name: '唐峰', position: '产品研发经理', isLeader: true },
      { name: '陈小明', position: '高级编程工程师' },
      { name: '言江江', position: '软件研发主管' },
      { name: '沈阳', position: '视觉工程师' },
      { name: '梁远宁', position: '视觉工程师' },
      { name: '李浩', position: '电气经理' },
      { name: '杨金鑫', position: '视觉工程师' }
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
          .input('department_id', sql.Int, rdDeptId)
          .query(`
            UPDATE sys_users 
            SET position = @position, 
                department_id = @department_id,
                updated_at = GETDATE()
            WHERE id = @id
          `);
        console.log(`Updated user: ${user.name} - ${user.position}`);
      } else {
        // 创建新用户
        const username = user.name.toLowerCase().replace(/\s/g, '');
        const defaultPassword = '123456'; // 默认密码
        await pool.request()
          .input('username', sql.NVarChar, username)
          .input('name', sql.NVarChar, user.name)
          .input('position', sql.NVarChar, user.position)
          .input('department_id', sql.Int, rdDeptId)
          .input('role', sql.NVarChar, 'employee')
          .input('status', sql.NVarChar, 'active')
          .input('password_hash', sql.NVarChar, defaultPassword)
          .query(`
            INSERT INTO sys_users (username, name, position, department_id, role, status, password_hash, created_at)
            VALUES (@username, @name, @position, @department_id, @role, @status, @password_hash, GETDATE())
          `);
        console.log(`Created user: ${user.name} - ${user.position}`);
      }
    }

    // 验证更新结果
    const verifyResult = await pool.request()
      .input('dept_id', sql.Int, rdDeptId)
      .query(`
        SELECT u.id, u.name, u.position, d.name as department_name
        FROM sys_users u
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE u.department_id = @dept_id AND u.status = 'active'
        ORDER BY u.id
      `);

    console.log('\nUpdated R&D users:');
    verifyResult.recordset.forEach(u => {
      console.log(`  - ${u.name}: ${u.position}`);
    });

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateRDUsers();
