const sql = require('mssql');
const config = require('../config/index').database;

async function updateUserTable() {
  try {
    console.log('=== 更新用户表，添加职位字段 ===\n');
    
    const pool = await sql.connect(config);
    
    // 检查并添加 position_id 字段
    console.log('添加 position_id 字段...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('sys_users') AND name = 'position_id'
      )
      BEGIN
        ALTER TABLE sys_users ADD position_id INT NULL;
        ALTER TABLE sys_users ADD CONSTRAINT FK_sys_users_position 
        FOREIGN KEY (position_id) REFERENCES sys_positions(id);
        PRINT '✅ position_id 字段添加成功';
      END
      ELSE
      BEGIN
        PRINT '⚠️  position_id 字段已存在';
      END
    `);
    
    // 根据现有用户的 position 字段更新 position_id
    console.log('更新现有用户职位数据...');
    await pool.request().query(`
      UPDATE u
      SET u.position_id = p.id
      FROM sys_users u
      INNER JOIN sys_positions p ON u.position = p.position_name
      WHERE u.position_id IS NULL AND p.position_name = u.position;
    `);
    
    console.log('✅ 用户职位数据更新完成\n');
    
    // 验证结果
    const result = await pool.request().query(`
      SELECT 
        u.name as [姓名],
        u.position as [原职位],
        p.position_name as [新职位],
        p.position_type as [职位类型]
      FROM sys_users u
      LEFT JOIN sys_positions p ON u.position_id = p.id
      WHERE u.status = 'active'
      ORDER BY u.name;
    `);
    
    console.log('用户职位映射情况:');
    console.table(result.recordset);
    
    await pool.close();
    console.log('\n✅ 用户表更新完成！');
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}

updateUserTable();
