/**
 * 添加员工工号字段并更新工号数据
 */

const { getPool } = require('../config/database');
const sql = require('mssql');

async function addEmployeeNo() {
  try {
    const pool = await getPool();
    console.log('开始添加员工工号字段...');

    // 1. 检查 sys_users 表是否有 employee_no 字段
    const columnCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'sys_users' AND COLUMN_NAME = 'employee_no'`);

    if (columnCheck.recordset[0].count === 0) {
      console.log('添加 employee_no 字段到 sys_users 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[sys_users] ADD [employee_no] INT NULL
      `);
      console.log('employee_no 字段添加成功');
    } else {
      console.log('employee_no 字段已存在');
    }

    // 2. 根据图片中的数据更新工号
    const employeeData = [
      { name: 'Emonts Manfred Claude Jean', employee_no: 1 },
      { name: '郑风华', employee_no: 2 },
      { name: '李浩', employee_no: 3 },
      { name: '张秀兰', employee_no: 8 },
      { name: '唐峰', employee_no: 9 },
      { name: '李海', employee_no: 10 },
      { name: '方要', employee_no: 14 },
      { name: '周美芳', employee_no: 16 },
      { name: '陈小明', employee_no: 17 },
      { name: '陈云明', employee_no: 18 },
      { name: '李培兵', employee_no: 19 },
      { name: '秦海军', employee_no: 20 },
      { name: '马志乐', employee_no: 21 },
      { name: '毕照卫', employee_no: 23 },
      { name: '傅晋清', employee_no: 26 },
      { name: '李继连', employee_no: 28 },
      { name: '王冰冰', employee_no: 30 },
      { name: '夏前锦', employee_no: 36 },
      { name: '张益汉', employee_no: 45 },
      { name: '陈庆权', employee_no: 46 },
      { name: '蔡振月', employee_no: 47 },
      { name: '李全', employee_no: 49 },
      { name: '吴飞', employee_no: 50 },
      { name: '陈明杰', employee_no: 51 },
      { name: '连加华', employee_no: 53 },
      { name: '刘建涛', employee_no: 54 },
      { name: '薄宏林', employee_no: 58 }
    ];

    console.log(`开始更新 ${employeeData.length} 位员工的工号...`);

    let updatedCount = 0;
    for (const emp of employeeData) {
      // 先查找匹配的用户
      const userResult = await pool.request()
        .input('name', sql.NVarChar, emp.name)
        .query(`SELECT id, name FROM sys_users WHERE name = @name AND status = 'active'`);

      if (userResult.recordset.length > 0) {
        // 更新工号
        await pool.request()
          .input('employee_no', sql.Int, emp.employee_no)
          .input('name', sql.NVarChar, emp.name)
          .query(`
            UPDATE sys_users 
            SET employee_no = @employee_no 
            WHERE name = @name AND status = 'active'
          `);
        console.log(`✅ 更新成功: ${emp.name} -> 工号 ${emp.employee_no}`);
        updatedCount++;
      } else {
        console.log(`⚠️ 未找到用户: ${emp.name}`);
      }
    }

    console.log(`\n工号更新完成！成功更新 ${updatedCount}/${employeeData.length} 位员工`);

    // 3. 显示更新后的结果
    const result = await pool.request().query(`
      SELECT employee_no, name, department_id, position 
      FROM sys_users 
      WHERE employee_no IS NOT NULL 
      ORDER BY employee_no
    `);

    console.log('\n已更新工号的员工列表:');
    console.table(result.recordset);

    process.exit(0);
  } catch (error) {
    console.error('添加员工工号失败:', error);
    process.exit(1);
  }
}

addEmployeeNo();
