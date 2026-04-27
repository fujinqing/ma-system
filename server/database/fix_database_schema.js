const { getPool } = require('../config/database');

async function fixDatabaseSchema() {
  try {
    const pool = await getPool();
    console.log('检查并修复数据库表结构...');

    // 检查 sys_users 表是否有 team_id 字段
    const columnCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'sys_users' AND COLUMN_NAME = 'team_id'`);

    if (columnCheck.recordset[0].count === 0) {
      console.log('添加 team_id 字段到 sys_users 表...');
      await pool.request().query(`
        ALTER TABLE [dbo].[sys_users] ADD [team_id] INT NULL
      `);
      console.log('team_id 字段添加成功');
    } else {
      console.log('team_id 字段已存在');
    }

    // 检查外键约束
    const fkCheck = await pool.request()
      .query(`SELECT COUNT(*) as count FROM sys.foreign_keys WHERE name = 'FK_sys_users_team'`);

    if (fkCheck.recordset[0].count === 0) {
      console.log('添加外键约束...');
      try {
        await pool.request().query(`
          ALTER TABLE [dbo].[sys_users] 
          ADD CONSTRAINT [FK_sys_users_team] 
          FOREIGN KEY ([team_id]) REFERENCES [dbo].[sys_teams] ([id]) 
          ON SET NULL ON UPDATE CASCADE
        `);
        console.log('外键约束添加成功');
      } catch (fkError) {
        console.log('外键约束添加失败（可能 sys_teams 表不存在）:', fkError.message);
      }
    } else {
      console.log('外键约束已存在');
    }

    console.log('数据库表结构检查完成');
    process.exit(0);
  } catch (error) {
    console.error('修复数据库表结构失败:', error);
    process.exit(1);
  }
}

fixDatabaseSchema();
