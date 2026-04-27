const db = require('../config/database');
const sql = db.sql;

// 新的Excel数据
const userData = [
  { employee_no: 142, name: '侯明刚', join_date: '2022-01-10', position: '钳工', gender: 'male' },
  { employee_no: 146, name: '陆新洁', join_date: '2022-02-14', position: '调试工程师', gender: 'male' },
  { employee_no: 149, name: '孙吉伟', join_date: '2022-02-21', position: '调试工程师', gender: 'male' },
  { employee_no: 151, name: '邓义龙', join_date: '2022-02-21', position: '调试工程师', gender: 'male' },
  { employee_no: 153, name: '王化宙', join_date: '2022-02-22', position: '机械工程师', gender: 'male' },
  { employee_no: 155, name: '王辉', join_date: '2022-03-01', position: '机械工程师', gender: 'male' },
  { employee_no: 156, name: '涂洪峰', join_date: '2022-03-07', position: '调试工程师', gender: 'male' },
  { employee_no: 157, name: '吕广政', join_date: '2022-03-07', position: '调试工程师', gender: 'male' },
  { employee_no: 159, name: '庞春元', join_date: '2022-03-28', position: '电气设计主管', gender: 'male' },
  { employee_no: 161, name: '沈阳', join_date: '2022-04-22', position: '视觉工程师', gender: 'male' },
  { employee_no: 162, name: '刘培', join_date: '2022-04-27', position: '项目经理', gender: 'male' },
  { employee_no: 163, name: '刘九安', join_date: '2022-05-09', position: '电气工程师', gender: 'male' },
  { employee_no: 164, name: '纪冉', join_date: '2022-05-09', position: '技术助理', gender: 'female' },
  { employee_no: 166, name: '章丽雨', join_date: '2022-05-09', position: '机械工程师', gender: 'female' },
  { employee_no: 168, name: '夏良', join_date: '2022-05-16', position: '钳工', gender: 'male' },
  { employee_no: 169, name: '王东', join_date: '2022-05-16', position: '生产主管', gender: 'male' },
  { employee_no: 170, name: '龙焱文', join_date: '2022-05-16', position: '电工', gender: 'male' },
  { employee_no: 171, name: '张亮', join_date: '2022-05-16', position: '电工', gender: 'male' },
  { employee_no: 173, name: '魏丛文', join_date: '2022-05-16', position: '机械工程师', gender: 'male' },
  { employee_no: 177, name: '马婷婷', join_date: '2022-06-06', position: '计划', gender: 'female' },
  { employee_no: 178, name: '赵红伟', join_date: '2022-06-06', position: '钳工', gender: 'male' },
  { employee_no: 179, name: '梁志', join_date: '2022-06-13', position: '助理工程师', gender: 'male' },
  { employee_no: 182, name: '张金旭', join_date: '2022-06-21', position: '调试工程师', gender: 'male' },
  { employee_no: 184, name: '孙秀丽', join_date: '2022-06-22', position: '采购助理', gender: 'female' },
  { employee_no: 185, name: '刘恩万', join_date: '2022-06-27', position: '钳工', gender: 'male' },
  { employee_no: 187, name: '游剑峰', join_date: '2022-07-18', position: 'IT工程师', gender: 'male' },
  { employee_no: 188, name: '刘金金', join_date: '2022-07-18', position: '电气工程师', gender: 'female' },
  { employee_no: 190, name: '朱琳', join_date: '2022-07-18', position: '财务经理', gender: 'female' },
  { employee_no: 191, name: '张力力', join_date: '2022-07-18', position: '生产组长', gender: 'male' },
  { employee_no: 192, name: '王丹', join_date: '2022-07-25', position: '电气工程师', gender: 'female' },
  { employee_no: 194, name: '李向银', join_date: '2022-07-25', position: '采购调试主管', gender: 'male' },
  { employee_no: 196, name: '张慧敏', join_date: '2022-08-04', position: '客服工程师', gender: 'female' },
  { employee_no: 197, name: '孙仙亮', join_date: '2022-08-08', position: '客服部经理', gender: 'male' },
  { employee_no: 199, name: '张滨', join_date: '2022-08-15', position: '调试工程师', gender: 'male' },
  { employee_no: 200, name: '赵嘉鑫', join_date: '2022-08-15', position: '服务工程师', gender: 'male' },
  { employee_no: 201, name: '梁远宁', join_date: '2022-08-15', position: '视觉工程师', gender: 'male' },
  { employee_no: 203, name: '杨桦', join_date: '2022-08-18', position: '电工', gender: 'male' },
  { employee_no: 205, name: '张炳州', join_date: '2022-08-22', position: '电工', gender: 'male' },
  { employee_no: 205, name: '吴松', join_date: '2022-08-26', position: '现场经理', gender: 'male' },
  { employee_no: 206, name: '姜科', join_date: '2022-09-01', position: '电工', gender: 'male' },
  { employee_no: 207, name: '章超', join_date: '2022-09-05', position: '助理工程师', gender: 'male' }
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
      SELECT 
        id,
        employee_no AS '工号',
        name AS '姓名',
        gender AS '性别',
        join_date AS '入职时间',
        position AS '职位'
      FROM sys_users
      WHERE employee_no IS NOT NULL AND status = 'active'
      ORDER BY employee_no DESC
      OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
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
