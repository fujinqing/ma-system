const sql = require('mssql');
const config = require('../config/index').database;

async function updateFullOrg() {
  try {
    console.log('=== 更新完整组织架构 ===\n');
    
    const pool = await sql.connect(config);
    
    // 1. 备份现有用户数据
    console.log('备份现有用户数据...');
    const existingUsers = await pool.request().query(`
      SELECT u.*, d.name as old_dept_name
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE u.status = 'active'
    `);
    console.log(`找到 ${existingUsers.recordset.length} 个现有用户\n`);
    
    // 2. 删除外键约束
    console.log('临时删除外键约束...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__sys_users__depar__2759D01A')
      ALTER TABLE sys_users DROP CONSTRAINT FK__sys_users__depar__2759D01A
    `);
    
    // 3. 清空部门数据
    console.log('清空现有部门结构...');
    await pool.request().query('DELETE FROM sys_departments');
    
    // 4. 创建新的部门结构
    console.log('创建新部门结构...\n');
    
    // 插入所有部门（使用固定 ID）
    await pool.request().query(`
      SET IDENTITY_INSERT sys_departments ON;
      
      -- 一级部门（11 个）
      INSERT INTO sys_departments (id, name, department_code, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
      VALUES 
      (1, '质量安全部', 'QA', NULL, 10, 0, 'fa fa-shield-alt', '#FF6B6B', '质量安全部', 1, NULL, 'active'),
      (2, '供应链管理部', 'SCM', NULL, 20, 0, 'fa fa-truck', '#4ECDC4', '供应链管理部', 2, NULL, 'active'),
      (3, '人事行政部', 'HR', NULL, 5, 0, 'fa fa-users', '#95E1D3', '人事行政部', 3, NULL, 'active'),
      (4, '财务&商务部', 'FIN', NULL, 10, 0, 'fa fa-yen-sign', '#F7FFF7', '财务&商务部', 4, NULL, 'active'),
      (5, '铸造事业部', 'CAST', NULL, 50, 0, 'fa fa-industry', '#FFE66D', '铸造事业部', 5, NULL, 'active'),
      (6, '光伏半导体事业部', 'PV', NULL, 30, 0, 'fa fa-solar-panel', '#6B5B95', '光伏半导体事业部', 6, NULL, 'active'),
      (7, '产品研发部', 'RD', NULL, 15, 0, 'fa fa-lightbulb', '#88B04B', '产品研发部', 7, NULL, 'active'),
      (8, '电池事业部', 'BATT', NULL, 30, 0, 'fa fa-car-battery', '#92A8D1', '电池事业部', 8, NULL, 'active'),
      (9, '市场&海外营销部', 'MKT', NULL, 10, 0, 'fa fa-globe', '#FF6B6B', '市场&海外营销部', 9, NULL, 'active'),
      (10, '工程部', 'ENG', NULL, 80, 0, 'fa fa-cogs', '#4ECDC4', '工程部', 10, NULL, 'active'),
      (11, '项目部', 'PM', NULL, 15, 0, 'fa fa-project-diagram', '#95E1D3', '项目部', 11, NULL, 'active');
      
      SET IDENTITY_INSERT sys_departments OFF;
    `);
    
    console.log('✅ 一级部门创建完成\n');
    
    // 5. 重新创建外键约束
    console.log('重新创建外键约束...');
    await pool.request().query(`
      ALTER TABLE sys_users 
      ADD CONSTRAINT FK__sys_users__depar__2759D01A 
      FOREIGN KEY (department_id) REFERENCES sys_departments(id)
    `);
    
    // 6. 更新现有用户的部门映射
    console.log('更新用户部门映射...');
    
    // 根据用户名或姓名匹配到对应部门
    const userUpdates = [
      // 总经办（无部门）
      { username: 'zhengfh', deptId: null, note: '总经理 - 直属' },
      { username: 'tech_advisor', deptId: null, note: '技术顾问 - 直属' },
      
      // 质量安全部
      { username: 'liquan', deptId: 1, note: '质量安全部' },
      { username: 'liquan2', deptId: 1, note: '质量安全部' },
      { username: 'zhangmm', deptId: 1, note: '质量安全部' },
      { username: 'wangjl', deptId: 1, note: '质量安全部' },
      { username: 'renjj', deptId: 1, note: '质量安全部' },
      
      // 供应链管理部
      { username: 'zhangyl', deptId: 2, note: '供应链管理部' },
      { username: 'zhangjie', deptId: 2, note: '供应链管理部' },
      { username: 'zhaocc', deptId: 2, note: '供应链管理部' },
      { username: 'lichao', deptId: 2, note: '供应链管理部' },
      { username: 'masn', deptId: 2, note: '供应链管理部' },
      { username: 'sunxl', deptId: 2, note: '供应链管理部' },
      { username: 'xumz', deptId: 2, note: '供应链管理部' },
      { username: 'wangbx', deptId: 2, note: '供应链管理部' },
      { username: 'zhanghm', deptId: 2, note: '供应链管理部' },
      { username: 'yuanmj', deptId: 2, note: '供应链管理部' },
      { username: 'kongzj', deptId: 2, note: '供应链管理部' },
      { username: 'fangw', deptId: 2, note: '供应链管理部' }
    ];
    
    for (const user of userUpdates) {
      if (user.deptId) {
        await pool.request()
          .input('username', sql.NVarChar, user.username)
          .input('deptId', sql.Int, user.deptId)
          .query(`UPDATE sys_users SET department_id = @deptId WHERE username = @username`);
      }
    }
    
    console.log('✅ 用户部门映射完成\n');
    
    // 7. 更新部门人数统计
    console.log('更新部门人数统计...');
    await pool.request().query(`
      UPDATE sys_departments 
      SET current_staff = (
        SELECT COUNT(*) FROM sys_users u 
        WHERE u.department_id = sys_departments.id AND u.status = 'active'
      )
    `);
    
    console.log('✅ 部门人数统计完成\n');
    
    // 8. 查询验证
    const depts = await pool.request().query(`
      SELECT 
        d.id,
        d.name as [部门名称],
        d.department_code as [代码],
        d.manager as [经理],
        d.headcount as [编制],
        d.current_staff as [现员],
        ISNULL(p.name, '无') as [上级部门]
      FROM sys_departments d
      LEFT JOIN sys_departments p ON d.parent_id = p.id
      WHERE d.status = 'active'
      ORDER BY d.sort_order
    `);
    
    console.log('=== 部门结构 ===');
    console.table(depts.recordset);
    
    const users = await pool.request().query(`
      SELECT 
        ISNULL(d.name, '未分配') as [部门],
        u.name as [姓名],
        u.username as [账号],
        u.position as [职位],
        u.role as [角色]
      FROM sys_users u
      LEFT JOIN sys_departments d ON u.department_id = d.id
      WHERE u.status = 'active'
      ORDER BY d.name, u.name
    `);
    
    console.log('\n=== 人员分布 ===');
    console.table(users.recordset);
    
    // 统计
    const total = users.recordset.length;
    const assigned = users.recordset.filter(u => u['部门'] !== '未分配' && u['部门'] !== null).length;
    const unassigned = total - assigned;
    
    console.log(`\n=== 统计 ===`);
    console.log(`总人数：${total}`);
    console.log(`已分配部门：${assigned}`);
    console.log(`未分配部门：${unassigned}`);
    
    await pool.close();
    console.log('\n✅ 所有更新完成！');
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}

updateFullOrg();
