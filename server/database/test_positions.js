const db = require('../config/database');
const sql = db.sql;

async function testPositions() {
  try {
    console.log('=== 测试职位数据 ===\n');
    
    const pool = await db.getPool();
    
    // 查询所有职位
    const positions = await pool.request().query(`
      SELECT 
        p.*,
        d.name as department_name
      FROM sys_positions p
      LEFT JOIN sys_departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY p.position_type, p.sort_order, p.position_name
    `);
    
    console.log(`总职位数：${positions.recordset.length}\n`);
    
    // 按类型分组
    const management = positions.recordset.filter(p => p.position_type === 'management');
    const technical = positions.recordset.filter(p => p.position_type === 'technical');
    const common = positions.recordset.filter(p => p.position_type === 'common');
    
    console.log('管理职位：');
    console.table(management.map(p => ({ name: p.position_name, dept: p.department_name || '全部' })));
    
    console.log('\n技术职位：');
    console.table(technical.map(p => ({ name: p.position_name, dept: p.department_name || '全部' })));
    
    console.log('\n通用职位：');
    console.table(common.map(p => ({ name: p.position_name, dept: p.department_name || '全部' })));
    
    // 查询用户职位映射
    console.log('\n=== 用户职位映射 ===\n');
    const users = await pool.request().query(`
      SELECT 
        u.name as [姓名],
        u.position as [原职位],
        p.position_name as [新职位],
        p.position_type as [职位类型],
        d.name as [部门]
      FROM sys_users u
      LEFT JOIN sys_positions p ON u.position_id = p.id
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE u.status = 'active'
      ORDER BY d.name, u.name
    `);
    
    console.table(users.recordset);
    
    await db.closePool();
    console.log('\n✅ 测试完成！（已释放共享连接）');
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}

testPositions();
