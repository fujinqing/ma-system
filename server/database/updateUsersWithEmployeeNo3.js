const db = require('../config/database');
const sql = db.sql;

// 新的Excel数据
const userData = [
  { employee_no: 208, name: '杨晓峰', join_date: '2022-09-05', position: '服务工程师', gender: 'male' },
  { employee_no: 209, name: '白钢', join_date: '2022-09-26', position: '电池设计主管', gender: 'male' },
  { employee_no: 214, name: '曹文远', join_date: '2022-10-06', position: '调试工程师', gender: 'male' },
  { employee_no: 216, name: '吴洪平', join_date: '2022-10-25', position: '机械工程师', gender: 'male' },
  { employee_no: 218, name: '徐美珠', join_date: '2022-10-17', position: '采购工程师', gender: 'female' },
  { employee_no: 220, name: '钱晶晶', join_date: '2022-10-24', position: '电气工程师', gender: 'female' },
  { employee_no: 221, name: '吕科润', join_date: '2022-10-24', position: '项目经理', gender: 'male' },
  { employee_no: 223, name: '张安龙', join_date: '2022-10-25', position: '电气工程师', gender: 'male' },
  { employee_no: 224, name: '朱凯', join_date: '2022-10-25', position: '项目经理', gender: 'male' },
  { employee_no: 227, name: '赵成成', join_date: '2022-11-01', position: '仓管员', gender: 'male' },
  { employee_no: 229, name: '孔子娟', join_date: '2022-11-07', position: '采购物流主管', gender: 'female' },
  { employee_no: 232, name: '周强', join_date: '2022-11-14', position: '项目经理', gender: 'male' },
  { employee_no: 235, name: '雷庆辉', join_date: '2022-11-16', position: '钳工', gender: 'male' },
  { employee_no: 237, name: '岳琦', join_date: '2022-11-17', position: '人事专员', gender: 'male' },
  { employee_no: 238, name: '周瑜', join_date: '2022-11-29', position: '会计', gender: 'female' },
  { employee_no: 239, name: '李阳', join_date: '2022-11-29', position: '电工', gender: 'male' },
  { employee_no: 240, name: '张明凯', join_date: '2022-11-29', position: '电工', gender: 'male' },
  { employee_no: 241, name: '於中华', join_date: '2022-12-05', position: '调试工程师', gender: 'male' },
  { employee_no: 244, name: '王碧肖', join_date: '2022-12-26', position: '采购工程师', gender: 'female' },
  { employee_no: 243, name: '李超', join_date: '2023-01-01', position: '仓管员', gender: 'male' },
  { employee_no: 249, name: '袁海波', join_date: '2023-01-16', position: '钳工', gender: 'male' },
  { employee_no: 252, name: '宋立民', join_date: '2023-02-03', position: '电工', gender: 'male' },
  { employee_no: 254, name: '崔永涛', join_date: '2023-02-13', position: '钳工', gender: 'male' },
  { employee_no: 256, name: '李琪', join_date: '2023-03-10', position: '项目工程师', gender: 'female' },
  { employee_no: 258, name: '胡成怀', join_date: '2023-03-27', position: '机械工程师', gender: 'male' },
  { employee_no: 259, name: '魏通彤', join_date: '2023-04-03', position: '机械工程师', gender: 'male' },
  { employee_no: 261, name: '范小龙', join_date: '2023-04-03', position: '钳工', gender: 'male' },
  { employee_no: 262, name: '王宁', join_date: '2023-04-03', position: '机械工程师', gender: 'male' },
  { employee_no: 267, name: '王子祥', join_date: '2023-05-04', position: '助理工程师', gender: 'male' },
  { employee_no: 268, name: '邸维龙', join_date: '2023-05-04', position: '项目经理', gender: 'male' },
  { employee_no: 270, name: '潘佳', join_date: '2023-05-05', position: '安全工程师', gender: 'male' },
  { employee_no: 271, name: '金仕琳', join_date: '2023-05-05', position: '质检员', gender: 'female' },
  { employee_no: 272, name: '王坤', join_date: '2023-05-08', position: '机械工程师', gender: 'male' },
  { employee_no: 274, name: '史桃辉', join_date: '2023-05-08', position: '钳工', gender: 'male' },
  { employee_no: 276, name: '段胜建', join_date: '2023-05-15', position: '机械工程师', gender: 'male' },
  { employee_no: 277, name: '王亮', join_date: '2023-05-15', position: '电工', gender: 'male' },
  { employee_no: 278, name: '徐大忠', join_date: '2023-05-17', position: '机械设计组长', gender: 'male' },
  { employee_no: 279, name: '杨宇', join_date: '2023-05-19', position: '机械工程师', gender: 'male' },
  { employee_no: 280, name: '吴双', join_date: '2023-05-22', position: '机械工程师', gender: 'male' },
  { employee_no: 281, name: '郑宇龙', join_date: '2023-06-01', position: '调试工程师', gender: 'male' },
  { employee_no: 40, name: '徐茂', join_date: '2023-06-01', position: '机械工程师', gender: 'male' }
];

async function updateUsersWithEmployeeNo() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 获取没有工号的用户
    const result = await pool.request().query(`
      SELECT id, name, gender, join_date, position, department_id, team_id
      FROM sys_users
      WHERE employee_no IS NULL AND status = 'active'
      ORDER BY id
    `);

    const usersWithoutEmployeeNo = result.recordset;
    console.log(`找到 ${usersWithoutEmployeeNo.length} 个没有工号的用户`);

    if (usersWithoutEmployeeNo.length === 0) {
      console.log('没有需要更新的用户');
      await pool.close();
      return;
    }

    // 按顺序为用户分配工号
    let updatedCount = 0;
    console.log('\n正在为用户分配工号并更新信息...');

    for (let i = 0; i < Math.min(usersWithoutEmployeeNo.length, userData.length); i++) {
      const user = usersWithoutEmployeeNo[i];
      const excelData = userData[i];

      const updateResult = await pool.request()
        .input('id', sql.Int, user.id)
        .input('employee_no', sql.Int, excelData.employee_no)
        .input('name', sql.NVarChar, excelData.name)
        .input('gender', sql.NVarChar, excelData.gender)
        .input('join_date', sql.Date, excelData.join_date)
        .input('position', sql.NVarChar, excelData.position)
        .query(`
          UPDATE sys_users SET 
            employee_no = @employee_no,
            name = @name,
            gender = @gender,
            join_date = @join_date,
            position = @position
          WHERE id = @id
        `);

      if (updateResult.rowsAffected[0] > 0) {
        updatedCount++;
        console.log(`✅ 更新用户 ID ${user.id}: ${excelData.name} (工号: ${excelData.employee_no})`);
      }
    }

    console.log(`\n✅ 完成！成功更新 ${updatedCount} 个用户`);

    // 验证更新结果
    console.log('\n=== 验证更新结果 ===');
    const verifyResult = await pool.request().query(`
      SELECT TOP 20
        id,
        employee_no AS '工号',
        name AS '姓名',
        gender AS '性别',
        join_date AS '入职时间',
        position AS '职位'
      FROM sys_users
      WHERE employee_no IS NOT NULL AND status = 'active'
      ORDER BY employee_no DESC
    `);

    console.log(`\n已分配工号的用户数：${verifyResult.recordset.length}`);
    if (verifyResult.recordset.length > 0) {
      console.table(verifyResult.recordset);
    }

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

updateUsersWithEmployeeNo();
