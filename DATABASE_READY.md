# ✅ 数据库集成完成 - 使用指南

## 🎉 完成情况

数据库初始化已成功完成！所有数据已正确导入到 SQL Server 数据库中。

### 已创建的表
- ✅ `sys_departments` - 部门表（12 个部门）
- ✅ `sys_users` - 用户表（32 个用户）

### 组织架构

```
曼弗莱德智能制造公司 (182 人)
├── 总经办 (2 人) - 郑风华
├── 质量安全部 (4 人)
├── 供应链管理部 (3 人)
├── 人事行政部 (2 人)
├── 财务&商务部 (3 人)
├── 铸造事业部 (3 人)
├── 光伏半导体事业部 (3 人)
├── 产品研发部 (3 人)
├── 电池事业部 (2 人)
├── 市场&海外营销部 (2 人)
├── 工程部 (3 人)
└── 项目部 (2 人)
```

## 📋 下一步操作

### 1. 启动后端服务

```bash
cd d:\M-A_SYSTEM\frontend\server
node server.js
```

服务将在 http://localhost:3005 启动

### 2. 启动前端服务

```bash
cd d:\M-A_SYSTEM\frontend
npm run dev
```

前端将在 http://localhost:5173 启动

### 3. 访问用户管理

1. 登录系统（使用管理员账户）
2. 进入"系统设置" → "用户管理"
3. 查看树状视图或列表视图

### 4. 管理部门

点击"部门管理"按钮可以：
- ➕ 新增部门
- ✏️ 编辑部门信息
- 🗑️ 删除部门（总经办不可删除）
- 🏷️ 管理职位设置

## 🔧 功能特性

### 后端 API
- ✅ RESTful API 设计
- ✅ JWT 认证保护
- ✅ 审计日志记录
- ✅ 软删除机制
- ✅ 层级关系支持

### 前端功能
- ✅ 树状视图展示组织架构
- ✅ 列表视图展示详细信息
- ✅ 部门管理对话框
- ✅ 职位管理功能
- ✅ 图标和颜色选择
- ✅ 实时数据同步

### 数据管理
- ✅ 所有数据存储于 SQL Server
- ✅ 部门编码自动生成
- ✅ 层级自动计算
- ✅ 删除前验证（子部门、员工检查）

## 📁 重要文件

### 后端文件
- `server/controllers/departmentController.js` - 部门管理控制器
- `server/controllers/userController.js` - 用户管理控制器
- `server/routes/departmentRoutes.js` - 部门路由
- `server/routes/userRoutes.js` - 用户路由

### 数据库文件
- `server/database/init_departments.sql` - 部门表初始化
- `server/database/init_users.sql` - 用户表初始化
- `server/database/run_init.js` - 初始化执行脚本
- `server/database/verify_db.js` - 数据库验证脚本

### 前端文件
- `src/views/setting/DepartmentManagement.vue` - 部门管理组件
- `src/views/setting/UserList.vue` - 用户列表页面

## 🔍 API 端点

### 部门管理
```
GET    /api/departments       # 获取所有部门
GET    /api/departments/tree  # 获取树形结构
POST   /api/departments       # 创建部门
PUT    /api/departments/:id   # 更新部门
DELETE /api/departments/:id   # 删除部门
```

### 用户管理
```
GET    /api/auth/users        # 获取用户列表
POST   /api/auth/users        # 创建用户
PUT    /api/auth/users/:id    # 更新用户
DELETE /api/auth/users/:id    # 删除用户
```

## 📊 数据验证

运行验证脚本检查数据库状态：
```bash
cd server/database
node verify_db.js
```

## ⚠️ 注意事项

1. **密码安全**: 初始化脚本中的用户密码需要更新为实际密码
2. **权限配置**: 确保数据库用户有足够的权限
3. **数据备份**: 定期备份数据库
4. **连接配置**: 确保 `server/config/index.js` 中的数据库配置正确

## 🐛 故障排除

### 问题 1: 无法连接数据库
```bash
# 检查 SQL Server 服务
# 检查 server/config/index.js 中的配置
# 确认数据库 M-A_OP_ODB 存在
```

### 问题 2: 前端无法获取部门数据
```bash
# 确保后端服务已启动
# 检查浏览器控制台的网络请求
# 确认 API 路径正确：/api/departments
```

### 问题 3: 部门管理对话框无法打开
```bash
# 清除浏览器缓存
# 检查前端控制台错误
# 确认 DepartmentManagement 组件已正确导入
```

## 📝 测试清单

- [x] 数据库表创建成功
- [x] 部门数据初始化（12 个部门）
- [x] 用户数据初始化（32 个用户）
- [x] 后端 API 可访问
- [ ] 前端页面正常显示
- [ ] 部门管理功能可用
- [ ] 用户管理功能可用
- [ ] 树状视图显示正确
- [ ] 列表视图显示正确

## 🎯 后续开发建议

1. **密码加密**: 实现 bcrypt 密码加密
2. **批量导入**: 支持 Excel 导入用户
3. **部门拖拽**: 支持拖拽调整部门层级
4. **权限细化**: 实现更细粒度的数据权限
5. **操作日志**: 增强审计日志功能
6. **移动端**: 优化移动端的部门管理体验

## 📚 相关文档

- [数据库初始化说明](server/database/README.md)
- [实施总结](IMPLEMENTATION_SUMMARY.md)
- [快速启动指南](QUICK_START.md)

---

**完成时间**: 2026-03-28  
**状态**: ✅ 数据库初始化完成，可以开始使用
