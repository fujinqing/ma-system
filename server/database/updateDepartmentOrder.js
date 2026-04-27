const db = require('../config/database');
const sql = db.sql;

async function updateDepartmentOrder() {
  try {
    console.log('正在获取共享数据库连接...');
    const pool = await db.getPool();
    console.log('已连接到共享数据库连接池\n');

    // 查看当前部门数据
    console.log('=== 当前部门数据 ===');
    const currentDepts = await pool.request().query(`
      SELECT id, name, sort_order, status
      FROM sys_departments
      WHERE status = 'active'
      ORDER BY sort_order, id
    `);

    console.table(currentDepts.recordset);

    // 定义新的排序顺序
    const newOrder = [
      { name: '总经办', sort_order: 1 },
      { name: '人事行政部', sort_order: 2 },
      { name: '产品研发部', sort_order: 3 },
      { name: '供应链管理部', sort_order: 4 },
      { name: '财务&商务部', sort_order: 5 },
      { name: '市场&海外营销部', sort_order: 6 },
      { name: '测试部', sort_order: 7 },
      { name: '质量安全部', sort_order: 8 },
      { name: '光伏半导体事业部', sort_order: 9 },
      { name: '电池事业部', sort_order: 10 },
      { name: '铸造事业部', sort_order: 11 },
      { name: '项目部', sort_order: 12 },
      { name: '工程部', sort_order: 13 }
    ];

    // 更新排序
    console.log('\n=== 开始更新排序 ===');
    let updatedCount = 0;

    for (const item of newOrder) {
      const result = await pool.request()
        .input('name', sql.NVarChar, item.name)
        .input('sort_order', sql.Int, item.sort_order)
        .query(`
          UPDATE sys_departments
          SET sort_order = @sort_order
          WHERE name = @name AND status = 'active'
        `);

      if (result.rowsAffected[0] > 0) {
        updatedCount++;
        console.log(`✅ 更新部门: ${item.name} (排序: ${item.sort_order})`);
      } else {
        console.log(`❌ 未找到部门: ${item.name}`);
      }
    }

    console.log(`\n✅ 完成！成功更新 ${updatedCount} 个部门的排序`);

    // 验证更新结果
    console.log('\n=== 验证更新结果 ===');
    const updatedDepts = await pool.request().query(`
      SELECT id, name, sort_order, status
      FROM sys_departments
      WHERE status = 'active'
      ORDER BY sort_order, id
    `);

    console.table(updatedDepts.recordset);

    await db.closePool();
    console.log('\n数据库连接已关闭（已释放共享连接）');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

updateDepartmentOrder();
