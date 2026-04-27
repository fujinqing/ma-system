# 职位管理功能说明

## 功能概述

职位管理功能已完全集成到用户管理系统中，实现了以下功能：

1. **职位管理独立模块** - 可以单独管理公司所有职位
2. **用户 - 职位关联** - 每个用户都可以选择对应的职位
3. **职位分类** - 支持管理职位、技术职位、通用职位三种类型
4. **部门职位关联** - 职位可以关联到特定部门，也可以是全公司通用

## 数据库结构

### 1. sys_positions 表

```sql
CREATE TABLE sys_positions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    position_code NVARCHAR(50) NOT NULL,        -- 职位代码（大写英文 + 下划线）
    position_name NVARCHAR(100) NOT NULL,       -- 职位名称
    department_id INT NULL,                     -- 所属部门（NULL 表示全公司通用）
    position_type NVARCHAR(50) DEFAULT 'common', -- 职位类型
    description NVARCHAR(500) NULL,             -- 职位描述
    sort_order INT DEFAULT 0,                   -- 排序
    status NVARCHAR(20) DEFAULT 'active',       -- 状态
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
)
```

### 2. sys_users 表更新

添加了 `position_id` 字段，与 `sys_positions` 表关联：

```sql
ALTER TABLE sys_users ADD position_id INT NULL;
ALTER TABLE sys_users ADD CONSTRAINT FK_sys_users_position 
FOREIGN KEY (position_id) REFERENCES sys_positions(id);
```

## 职位分类

### 管理职位（management）
- 总经理
- 部门经理
- 主管
- 助理经理

### 技术职位（technical）
- 总工程师
- 高级工程师
- 工程师
- 助理工程师
- 技术员
- 各专业工程师（质量、安全、采购、财务等）

### 通用职位（common）
- 实习生
- 顾问
- 助理

## 后端 API

### 路由：`/api/positions`

#### GET /api/positions
获取所有职位列表

#### GET /api/positions/:id
获取单个职位详情

#### GET /api/positions/department/:departmentId
按部门获取职位（包括该部门职位和通用职位）

#### POST /api/positions
创建新职位（需要权限）

#### PUT /api/positions/:id
更新职位（需要权限）

#### DELETE /api/positions/:id
删除职位（软删除，需要权限）

## 前端界面

### 1. 职位管理页面

**路由**: `/setting/positions`

**功能**:
- 职位列表展示（支持搜索、筛选）
- 新增职位
- 编辑职位
- 删除职位
- 按部门/职位类型筛选

**文件**: `src/views/setting/PositionList.vue`

### 2. 用户管理中的职位选择

**路由**: `/setting/user`

**功能**:
- 添加/编辑用户时可选择职位
- 职位选择根据所选部门动态过滤
- 支持职位类型标签显示
- 支持搜索过滤

**文件**: `src/views/setting/UserList.vue`

## 使用流程

### 1. 管理职位

1. 进入"系统设置" → "职位管理"
2. 点击"新增职位"
3. 填写职位信息：
   - 职位代码：大写英文 + 下划线（如：MANAGER）
   - 职位名称：中文名称（如：经理）
   - 所属部门：可选，不选则为全公司通用
   - 职位类型：管理职位/技术职位/通用职位
   - 描述：职位描述
   - 排序：数字越小越靠前
4. 保存

### 2. 为用户分配职位

1. 进入"系统设置" → "用户管理"
2. 点击"添加用户"或编辑现有用户
3. 选择部门
4. 在"职位"下拉框中选择对应职位
   - 如果选择了部门，只显示该部门的职位和通用职位
   - 如果没有选择部门，显示所有通用职位和管理职位
5. 保存

## 数据库初始化脚本

### 创建职位表
```bash
cd server/database
node create_positions.js
```

### 更新用户表（添加 position_id 字段）
```bash
node update_user_positions.js
```

### 测试数据
```bash
node test_positions.js
```

## 代码文件清单

### 后端文件
- `server/controllers/positionController.js` - 职位管理控制器
- `server/routes/positionRoutes.js` - 职位管理路由
- `server/server.js` - 注册职位路由（已更新）
- `server/database/create_positions_table.sql` - 创建职位表 SQL
- `server/database/create_positions.js` - 执行创建脚本
- `server/database/update_user_positions.js` - 更新用户表脚本
- `server/database/test_positions.js` - 测试脚本

### 前端文件
- `src/views/setting/PositionList.vue` - 职位管理页面
- `src/views/setting/UserList.vue` - 用户管理页面（已更新）
- `src/router/index.js` - 路由配置（已更新）

## 特性说明

### 1. 智能职位过滤
- 用户选择部门后，职位列表会自动过滤
- 只显示该部门的专属职位和全公司通用职位
- 管理职位对所有部门可见

### 2. 职位类型标签
- 管理职位：橙色标签
- 技术职位：绿色标签
- 通用职位：灰色标签

### 3. 数据一致性
- 用户职位与职位表关联
- 删除职位时会检查是否有用户使用
- 使用软删除，保留历史数据

### 4. 可搜索
- 职位选择支持搜索功能
- 可快速定位目标职位

## 注意事项

1. **职位代码格式**：必须使用大写字母和下划线（如：QA_ENGINEER）
2. **删除限制**：已有用户使用的职位无法删除
3. **部门关联**：删除部门前需要先处理关联的职位
4. **权限控制**：创建、编辑、删除职位需要管理员权限

## 后续优化建议

1. 添加职位层级关系（如：初级工程师→中级工程师→高级工程师）
2. 添加职位任职资格要求
3. 添加职位晋升路径
4. 支持职位批量操作
5. 添加职位统计报表
