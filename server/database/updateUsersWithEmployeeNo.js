const db = require('../config/database');
const sql = db.sql;

// Excel数据
const userData = [
  { employee_no: 61, name: '徐广波', join_date: '2020-04-26', position: '现场经理', gender: 'male' },
  { employee_no: 62, name: '郦维国', join_date: '2020-05-25', position: '技术部主管', gender: 'male' },
  { employee_no: 66, name: '梁立桥', join_date: '2020-06-10', position: '机械设计组长', gender: 'male' },
  { employee_no: 68, name: '李辉', join_date: '2020-06-03', position: '工艺开发主管', gender: 'male' },
  { employee_no: 70, name: '张应龙', join_date: '2020-07-13', position: '仓库主管', gender: 'male' },
  { employee_no: 74, name: '康鹏飞', join_date: '2020-09-21', position: '服务工程师', gender: 'male' },
  { employee_no: 76, name: '姬华峰', join_date: '2020-11-26', position: '现场经理', gender: 'male' },
  { employee_no: 77, name: '石文飞', join_date: '2020-12-02', position: '采购工程师', gender: 'female' },
  { employee_no: 79, name: '岳清水', join_date: '2021-01-18', position: '电气设计主管', gender: 'male' },
  { employee_no: 82, name: '唐瑜', join_date: '2021-02-11', position: '销售经理', gender: 'male' },
  { employee_no: 83, name: '王震', join_date: '2021-02-22', position: '现场经理', gender: 'male' },
  { employee_no: 84, name: '赵学忠', join_date: '2021-02-22', position: '电工', gender: 'male' },
  { employee_no: 85, name: '何大海', join_date: '2021-03-01', position: '调试主管', gender: 'male' },
  { employee_no: 87, name: '崔岩', join_date: '2021-03-11', position: '机械设计组长', gender: 'male' },
  { employee_no: 88, name: '樊建峰', join_date: '2021-03-11', position: '钳工', gender: 'male' },
  { employee_no: 89, name: '杨忠雷', join_date: '2021-03-02', position: '现场经理', gender: 'male' },
  { employee_no: 90, name: '张明明', join_date: '2021-03-02', position: '质量工程师', gender: 'male' },
  { employee_no: 96, name: '蒋文平', join_date: '2021-04-14', position: '钳工', gender: 'male' },
  { employee_no: 97, name: '董修涛', join_date: '2021-04-14', position: '钳工', gender: 'male' },
  { employee_no: 98, name: '张永明', join_date: '2021-04-19', position: '服务工程师', gender: 'male' },
  { employee_no: 101, name: '徐以东', join_date: '2021-05-06', position: '调试主管', gender: 'male' },
  { employee_no: 102, name: '刘将', join_date: '2021-05-06', position: '项目经理', gender: 'male' },
  { employee_no: 103, name: '戴支文', join_date: '2021-05-07', position: '调试工程师', gender: 'male' },
  { employee_no: 107, name: '高鹦', join_date: '2021-06-01', position: '调试工程师', gender: 'male' },
  { employee_no: 80, name: '王健', join_date: '2021-06-01', position: '项目部主管', gender: 'male' },
  { employee_no: 113, name: '梁振杰', join_date: '2021-07-05', position: '调试工程师', gender: 'male' },
  { employee_no: 114, name: '雷雨田', join_date: '2021-07-05', position: '服务工程师', gender: 'male' },
  { employee_no: 122, name: '戴震元', join_date: '2021-08-02', position: '调试工程师', gender: 'male' },
  { employee_no: 124, name: '刘雷', join_date: '2021-08-12', position: '钳工', gender: 'male' },
  { employee_no: 126, name: '冯杰', join_date: '2021-08-16', position: '调试工程师', gender: 'male' },
  { employee_no: 127, name: '张博', join_date: '2021-09-01', position: '仓管员', gender: 'male' },
  { employee_no: 129, name: '叶泳兵', join_date: '2021-09-06', position: '服务工程师', gender: 'male' },
  { employee_no: 133, name: '王祥', join_date: '2021-10-18', position: '电工', gender: 'male' },
  { employee_no: 41, name: '侯晓晨', join_date: '2021-11-01', position: '生产主管', gender: 'male' },
  { employee_no: 134, name: '武艺', join_date: '2021-11-01', position: '电工', gender: 'male' },
  { employee_no: 135, name: '言江江', join_date: '2021-11-22', position: '软件主管', gender: 'male' },
  { employee_no: 137, name: '吴昊', join_date: '2021-12-01', position: '机械工程师', gender: 'male' },
  { employee_no: 138, name: '钱浩', join_date: '2021-12-01', position: '调试工程师', gender: 'male' },
  { employee_no: 139, name: '陈明明', join_date: '2021-12-01', position: '调试工程师', gender: 'male' },
  { employee_no: 140, name: '王兴超', join_date: '2021-12-13', position: '电工', gender: 'male' },
  { employee_no: 141, name: '吕国军', join_date: '2022-01-04', position: '钳工', gender: 'male' }
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
      ORDER BY employee_no
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
