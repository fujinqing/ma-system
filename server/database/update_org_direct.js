const sql = require('mssql');
const config = require('../config/index').database;

async function updateOrg() {
  try {
    console.log('=== 更新组织架构 ===\n');
    
    const pool = await sql.connect(config);
    
    // 清空数据
    console.log('清空现有数据...');
    await pool.request().query('DELETE FROM sys_users');
    await pool.request().query('DELETE FROM sys_departments');
    
    // 插入部门
    console.log('创建部门结构...');
    await pool.request().query(`
      SET IDENTITY_INSERT sys_departments ON;
      INSERT INTO sys_departments (id, name, department_code, manager, headcount, current_staff, icon, color, description, sort_order, parent_id, status) 
      VALUES 
      (1, '质量安全部', 'QA', NULL, 6, 0, 'fa fa-shield-alt', '#FF6B6B', '质量安全部', 1, NULL, 'active'),
      (2, '供应链管理部', 'SCM', NULL, 14, 0, 'fa fa-truck', '#4ECDC4', '供应链管理部', 2, NULL, 'active'),
      (3, '质量部', 'QC', '李全', 3, 0, 'fa fa-check-circle', '#95E1D3', '质量部', 1, 1, 'active'),
      (4, '安全部', 'SAFE', '李全', 2, 0, 'fa fa-user-shield', '#F7FFF7', '安全部', 2, 1, 'active'),
      (5, '仓库部', 'WH', '张应龙', 5, 0, 'fa fa-warehouse', '#FFE66D', '仓库部', 1, 2, 'active'),
      (6, '采购&物流部', 'PROC', '孙秀丽', 6, 0, 'fa fa-shopping-cart', '#6B5B95', '采购&物流部', 2, 2, 'active'),
      (7, '供应链部', 'SCM-D', '孔子娟', 1, 0, 'fa fa-link', '#88B04B', '供应链部', 3, 2, 'active'),
      (8, '市场&海外营销部', 'MKT', '方雯', 1, 0, 'fa fa-globe', '#92A8D1', '市场&海外营销部', 4, 2, 'active');
      SET IDENTITY_INSERT sys_departments OFF;
    `);
    
    // 插入用户
    console.log('创建用户数据...');
    await pool.request().query(`
      SET IDENTITY_INSERT sys_users ON;
      INSERT INTO sys_users (id, username, password_hash, name, role, department_id, position, phone, email, status, created_at)
      VALUES 
      (1, 'liquan', 'default123', '李全', 'dept_manager', 3, '主管', '', '', 'active', GETDATE()),
      (2, 'zhangmm', 'default123', '张明明', 'employee', 3, '质量工程师', '', '', 'active', GETDATE()),
      (3, 'wangjl', 'default123', '王金琳', 'employee', 3, '质检员', '', '', 'active', GETDATE()),
      (4, 'liquan2', 'default123', '李全', 'dept_manager', 4, '主管', '', '', 'active', GETDATE()),
      (5, 'renjj', 'default123', '任佳佳', 'employee', 4, '安全工程师', '', '', 'active', GETDATE()),
      (6, 'zhangyl', 'default123', '张应龙', 'dept_manager', 5, '主管', '', '', 'active', GETDATE()),
      (7, 'zhangjie', 'default123', '张杰', 'employee', 5, '仓管员', '', '', 'active', GETDATE()),
      (8, 'zhaocc', 'default123', '赵成成', 'employee', 5, '仓管员', '', '', 'active', GETDATE()),
      (9, 'lichao', 'default123', '李超', 'employee', 5, '仓管员', '', '', 'active', GETDATE()),
      (10, 'masn', 'default123', '马少娜', 'employee', 5, '实习生', '', '', 'active', GETDATE()),
      (11, 'sunxl', 'default123', '孙秀丽', 'supervisor', 6, '采购工程师', '', '', 'active', GETDATE()),
      (12, 'xumz', 'default123', '徐美珠', 'employee', 6, '采购工程师', '', '', 'active', GETDATE()),
      (13, 'wangbx', 'default123', '王碧肖', 'employee', 6, '采购工程师', '', '', 'active', GETDATE()),
      (14, 'zhanghm', 'default123', '张慧敏', 'employee', 6, '采购工程师', '', '', 'active', GETDATE()),
      (15, 'yuanmj', 'default123', '袁明杰', 'employee', 6, '物流专员', '', '', 'active', GETDATE()),
      (16, 'kongzj', 'default123', '孔子娟', 'dept_manager', 7, '主管', '', '', 'active', GETDATE()),
      (17, 'fangw', 'default123', '方雯', 'dept_manager', 8, '主管', '', '', 'active', GETDATE());
      SET IDENTITY_INSERT sys_users OFF;
    `);
    
    // 更新部门人数
    console.log('更新部门人数统计...');
    await pool.request().query(`
      UPDATE sys_departments 
      SET current_staff = (
        SELECT COUNT(*) FROM sys_users u 
        WHERE u.department_id = sys_departments.id AND u.status = 'active'
      )
    `);
    
    console.log('\n✅ 数据更新完成\n');
    
    // 查询验证
    const depts = await pool.request().query(`
      SELECT d.id, d.name as [部门], d.department_code as [代码], d.manager as [经理], d.current_staff as [人数], p.name as [上级]
      FROM sys_departments d
      LEFT JOIN sys_departments p ON d.parent_id = p.id
      WHERE d.status = 'active'
      ORDER BY d.sort_order, d.id
    `);
    
    console.log('部门结构:');
    console.table(depts.recordset);
    
    const users = await pool.request().query(`
      SELECT d.name as [部门], u.name as [姓名], u.position as [职位]
      FROM sys_users u
      JOIN sys_departments d ON u.department_id = d.id
      WHERE u.status = 'active'
      ORDER BY d.name, u.name
    `);
    
    console.log('\n人员列表:');
    console.table(users.recordset);
    
    await pool.close();
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}

updateOrg();
