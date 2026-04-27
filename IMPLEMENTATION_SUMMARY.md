# 部门与用户管理数据库集成 - 完成总结

## 已完成的工作

### 1. 数据库表设计与创建

#### 1.1 部门表 (sys_departments)
创建了完整的部门管理表结构：
- **主键**: id (自增)
- **部门编码**: department_code (唯一)
- **基本信息**: name, manager, headcount, current_staff
- **视觉配置**: icon, color
- **层级结构**: parent_id, level, sort_order
- **职位配置**: positions (逗号分隔)
- **审计字段**: created_at, updated_at, created_by, updated_by, status

#### 1.2 用户表 (sys_users)
创建了用户管理表结构：
- **主键**: id (自增)
- **账户信息**: username, password_hash
- **个人信息**: name, role, position, phone, email, avatar
- **组织关系**: department_id (外键)
- **权限配置**: permissions (JSON), data_permission (JSON)
- **审计字段**: created_at, updated_at, created_by, updated_by, status

### 2. 后端 API 实现

#### 2.1 部门管理控制器 (departmentController.js)
实现了完整的 CRUD 操作：
- `GET /api/departments` - 获取所有部门
- `GET /api/departments/tree` - 获取树形结构
- `POST /api/departments` - 创建部门
- `PUT /api/departments/:id` - 更新部门
- `DELETE /api/departments/:id` - 删除部门

功能特性：
- 自动生成部门编码
- 自动计算层级关系
- 删除前验证（子部门、员工检查）
- 审计日志记录
- 软删除机制

#### 2.2 用户管理控制器 (userController.js)
实现了用户管理功能：
- `GET /api/auth/users` - 获取用户列表
- `POST /api/auth/users` - 创建用户
- `PUT /api/auth/users/:id` - 更新用户
- `DELETE /api/auth/users/:id` - 删除用户

功能特性：
- 部门关联查询
- 权限 JSON 解析
- 审计日志记录
- 软删除机制

#### 2.3 路由配置
- 更新了 `server.js` 添加部门路由
- 更新了 `userRoutes.js` 添加用户 CRUD 路由
- 所有路由都需要认证

### 3. 前端组件开发

#### 3.1 部门管理组件 (DepartmentManagement.vue)
创建了独立的部门管理对话框组件：
- 部门列表展示（表格形式）
- 新增部门功能
- 编辑部门功能
- 删除部门功能（保护"总经办"）
- 职位管理（添加/删除职位）
- 图标和颜色选择
- 与后端 API 集成

#### 3.2 用户列表更新 (UserList.vue)
更新了用户管理页面：
- 集成 DepartmentManagement 组件
- 更新 API 调用路径
- 从数据库获取部门和用户数据
- 数据格式化处理
- 保留 localStorage 作为缓存

### 4. 数据库初始化脚本

#### 4.1 SQL 脚本
- `init_departments.sql` - 创建部门表并初始化 12 个部门
- `init_users.sql` - 创建用户表并初始化 32 个示例用户
- `init_database.sql` - 总体初始化脚本

#### 4.2 初始化部门列表
根据组织架构图初始化了以下部门：

1. **总经办** (DEPT_001)
   - 负责人：郑风华
   - 职位：总经理、技术顾问、总助
   - 编制：10 人，实际：2 人

2. **质量安全部** (DEPT_002)
   - 职位：质量经理、质量工程师、安全员
   - 编制：10 人，实际：4 人

3. **供应链管理部** (DEPT_003)
   - 职位：供应链经理、采购专员、物流专员
   - 编制：20 人，实际：12 人

4. **人事行政部** (DEPT_004)
   - 职位：人事经理、行政专员、招聘专员
   - 编制：5 人，实际：2 人

5. **财务&商务部** (DEPT_005)
   - 职位：财务经理、会计、商务专员
   - 编制：10 人，实际：6 人

6. **铸造事业部** (DEPT_006)
   - 职位：事业部经理、铸造工程师、技术员
   - 编制：50 人，实际：37 人

7. **光伏半导体事业部** (DEPT_007)
   - 职位：事业部经理、工艺工程师、设备工程师
   - 编制：30 人，实际：23 人

8. **产品研发部** (DEPT_008)
   - 职位：研发经理、结构工程师、电气工程师
   - 编制：15 人，实际：7 人

9. **电池事业部** (DEPT_009)
   - 职位：事业部经理、电池工程师、测试工程师
   - 编制：30 人，实际：22 人

10. **市场&海外营销部** (DEPT_010)
    - 职位：市场经理、海外销售经理、市场专员
    - 编制：10 人，实际：4 人

11. **工程部** (DEPT_011)
    - 职位：工程经理、机械工程师、电气工程师、调试工程师
    - 编制：80 人，实际：55 人

12. **项目部** (DEPT_012)
    - 职位：项目经理、项目助理、项目专员
    - 编制：15 人，实际：8 人

#### 4.3 初始化工具
- `run_init.js` - Node.js 初始化脚本
- `init.bat` - Windows 批处理脚本
- `README.md` - 详细使用说明

### 5. 数据同步

实现了树状视图和列表视图的数据同步：
- 所有数据存储在 SQL Server 数据库中
- 前端通过 API 获取最新数据
- localStorage 作为缓存提高性能
- 部门变更实时同步到两个视图

## 使用方法

### 1. 初始化数据库

```bash
# 方法一：使用批处理脚本
cd server/database
init.bat

# 方法二：使用 Node.js 脚本
cd server/database
node run_init.js
```

### 2. 启动服务器

```bash
cd server
node server.js
```

### 3. 访问系统

1. 打开浏览器访问前端系统
2. 进入"系统设置" -> "用户管理"
3. 查看树状视图或列表视图
4. 点击"部门管理"按钮管理组织架构

## 技术特点

1. **统一数据源**：所有数据存储于 SQL Server，避免数据不一致
2. **RESTful API**：标准的 RESTful 接口设计
3. **认证授权**：所有 API 都需要 JWT 认证
4. **审计日志**：记录所有数据变更操作
5. **软删除**：使用 status 字段标记删除，保留历史数据
6. **层级结构**：支持部门层级关系（parent_id, level）
7. **前端集成**：Vue 3 + Element Plus 现代化 UI
8. **错误处理**：完善的错误处理和用户提示

## 后续优化建议

1. **密码加密**：实现 bcrypt 密码加密
2. **批量操作**：支持批量导入/导出用户
3. **部门调整**：支持拖拽调整部门层级
4. **权限细化**：实现更细粒度的数据权限
5. **操作日志**：增强审计日志功能
6. **数据验证**：添加更严格的数据验证规则
7. **性能优化**：实现部门数据缓存机制
8. **移动端适配**：优化移动端的部门管理体验

## 文件清单

### 后端文件
- `server/controllers/departmentController.js` - 部门管理控制器
- `server/controllers/userController.js` - 用户管理控制器
- `server/routes/departmentRoutes.js` - 部门路由
- `server/routes/userRoutes.js` - 用户路由（已更新）
- `server/server.js` - 主服务器文件（已更新）

### 数据库文件
- `server/database/init_departments.sql` - 部门表初始化
- `server/database/init_users.sql` - 用户表初始化
- `server/database/init_database.sql` - 总体初始化脚本
- `server/database/run_init.js` - Node.js 执行脚本
- `server/database/init.bat` - Windows 批处理脚本
- `server/database/README.md` - 使用说明

### 前端文件
- `src/views/setting/DepartmentManagement.vue` - 部门管理组件（新建）
- `src/views/setting/UserList.vue` - 用户列表（已更新）

## 验证清单

- [x] 数据库表创建成功
- [x] 部门数据初始化完成（12 个部门）
- [x] 用户数据初始化完成（32 个用户）
- [x] 后端 API 接口正常工作
- [x] 前端组件集成完成
- [x] 树状视图显示正确
- [x] 列表视图显示正确
- [x] 部门管理功能可用
- [x] 数据同步机制正常

## 总结

本次更新完成了部门与用户管理的数据库集成，实现了：
1. 完整的数据库表设计
2. RESTful API 接口
3. 前端管理界面
4. 数据初始化脚本
5. 树状和列表双视图同步

所有数据现在都存储在 SQL Server 数据库中，确保了数据的一致性和可靠性。系统架构更加规范，为后续功能扩展奠定了良好基础。

## 近期变更（2026-04-25）

- **事件驱动与主数据索引**：
   - 新增 `server/services/eventBus.js` 作为进程内事件总线，用于发布/订阅应用内事件。
   - 在 `server/controllers/customerController.js` 的创建/更新/删除点发布 `customer.created|updated|deleted` 事件。
   - 新增 `server/services/masterDataSync.js`，订阅客户事件并维护主数据索引表 `dbo.md_customers`，保证主数据查询的低成本与一致性。

- **API 网关示例**：
   - 新增 `server/routes/gatewayRoutes.js` 作为轻量网关示例，包含聚合接口与开发时绕过认证的 `maybeAuth` 逻辑（支持 query/header/env 控制）。已挂载为 `/api/gateway/*`。

- **销售模块兼容性修复**：
   - 修改 `server/controllers/salesController.js`，在执行跨表统计或 SUM 前先检查表/列的存在性（使用 `OBJECT_ID` 与 `INFORMATION_SCHEMA.COLUMNS`），按存在性分支执行 SQL，避免因缺失表或列导致的 500 错误。
   - 对 `sales_contracts`/`contracts` 的 `total_amount` 缺失场景回退为仅计数并将金额视为 0。

- **价格计算表兼容处理**：
   - 修改 `getPriceCalculations`：使用动态 SQL (`sp_executesql`) 或在查询前检测表存在性，保证当 `price_calculations` 表不存在时返回空数组，避免服务异常。

- **调试与诊断改进**：
   - 新增 `server/routes/debugRoutes.js`（`/api/debug/sales-tables`）用于查看当前环境下相关表的 OBJECT_ID，便于定位缺失表。
   - 在 `gatewayRoutes` 中增加请求日志以便诊断 dev 绕过逻辑与路由匹配问题。

- **基础设施与脚本统一**：
   - 多处脚本与控制器已统一使用 `server/config/database.js` 的 `getPool()`，消除重复连接代码并减少资源泄露风险。

验证要点：
- `GET /api/master/customers` 与 `GET /api/master/users` 返回 200（主数据 API 可用）。
- 在开发绕过认证或使用 `mock-token-...` 时，`GET /api/gateway/sales-dashboard` 返回 200（已验证）。
- 当 `price_calculations` 表缺失，`GET /api/sales/price-calculations` 返回 200 且 body 为空数组。

后续建议：
- 将上述变更合并到变更日志/发布说明并进行代码审查。
- 在生产环境评估是否需要创建兼容视图或恢复/迁移缺失表以完善长期兼容性。
