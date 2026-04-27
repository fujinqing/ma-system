# 部门保存失败和工号可编辑修复

## 问题 1：新增部门保存失败

### 问题描述
新增部门时，点击保存后显示"创建部门失败"。

### 可能原因
1. 后端服务器未重启
2. 后端控制器代码有语法错误
3. 前端 API 调用路径错误
4. 数据库连接问题

### 检查内容

#### 后端路由 ✅
**文件**：`server/routes/departmentRoutes.js`
```javascript
// 创建部门
router.post('/', departmentController.createDepartment);
```
配置正确。

#### 后端控制器 ✅
**文件**：`server/controllers/departmentController.js`
- `createDepartment` 函数存在
- 导出正确
- SQL 语法正确

#### 前端 API 调用 ✅
**文件**：`src/views/setting/DepartmentManagement.vue`
```javascript
const url = this.isEdit 
  ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments/${this.departmentForm.id}`
  : `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/departments`

const method = this.isEdit ? 'PUT' : 'POST'
```
调用正确。

### 解决方案

**需要重启后端服务器**

```bash
cd d:\M-A_SYSTEM\frontend\server
npm start
```

### 测试步骤

1. **重启后端服务器**
   ```bash
   cd d:\M-A_SYSTEM\frontend\server
   # 按 Ctrl+C 停止
   npm start
   ```

2. **测试部门保存**
   - 打开浏览器
   - 进入"系统设置" → 部门管理
   - 点击"新增部门"
   - 填写部门名称等信息
   - 点击"保存"

3. **预期结果**
   - 显示"创建成功"
   - 部门列表中出现新部门

---

## 问题 2：工号改为可编辑

### 修改内容

将工号（username）字段在编辑时改为可由管理员编辑。

### 修改前
```vue
<el-input v-model="userForm.username" placeholder="请输入工号" :disabled="isEdit"></el-input>
```

### 修改后
```vue
<el-input v-model="userForm.username" placeholder="请输入工号" :disabled="isEdit && !userStore.isAdmin"></el-input>
```

### 逻辑说明

- **新增用户时**：工号可输入
- **编辑用户时**：
  - 管理员（admin 角色）：可以编辑工号
  - 非管理员：工号不可编辑

### 修改文件

**文件**：`src/views/setting/UserList.vue`
**位置**：第 154 行

### 测试步骤

1. **以管理员身份登录**
   - 用户名：admin
   - 角色：管理员

2. **编辑用户**
   - 进入"系统设置" → 用户管理
   - 点击某个用户的"编辑"按钮
   - 工号输入框应该可编辑

3. **以非管理员身份登录**
   - 编辑用户时，工号输入框应该不可编辑

---

## 修改文件清单

### 修改的文件
- ✅ `src/views/setting/UserList.vue` - 工号可编辑逻辑

### 无需修改的文件
- ❌ `server/controllers/departmentController.js` - 部门控制器正常
- ❌ `server/routes/departmentRoutes.js` - 部门路由正常
- ❌ `src/views/setting/DepartmentManagement.vue` - 部门管理界面正常

---

## 完整测试流程

### 测试 1：部门保存

```bash
# 1. 重启后端
cd d:\M-A_SYSTEM\frontend\server
npm start

# 2. 前端已运行，刷新浏览器

# 3. 测试部门保存
- 进入"系统设置" → 部门管理
- 点击"新增部门"
- 填写信息
- 保存
```

### 测试 2：工号编辑

```bash
# 1. 以管理员登录
- 用户名：admin
- 密码：******

# 2. 编辑用户
- 进入"系统设置" → 用户管理
- 点击"编辑"
- 检查工号是否可编辑

# 3. 修改工号并保存
- 修改工号
- 保存
- 检查是否成功
```

---

## 成功标志

### 部门保存
✅ 后端服务器正常启动  
✅ 新增部门成功  
✅ 显示"创建成功"提示  
✅ 部门列表更新  

### 工号编辑
✅ 管理员可以编辑工号  
✅ 非管理员不能编辑工号  
✅ 工号修改后保存成功  
✅ 用户列表显示新工号  

---

## 注意事项

### 部门保存
1. 确保后端服务器已重启
2. 确保数据库连接正常
3. 确保部门名称不重复

### 工号编辑
1. 只有管理员可以编辑工号
2. 工号修改后需要保证唯一性
3. 建议修改后通知用户

---

## 回滚方案

### 回滚工号编辑

如果需要恢复为不可编辑：

```vue
<!-- 修改回原来的代码 -->
<el-input v-model="userForm.username" placeholder="请输入工号" :disabled="isEdit"></el-input>
```

---

## 常见问题

### Q1: 部门保存仍然失败
**A**: 
1. 检查后端服务器日志
2. 检查浏览器控制台错误
3. 检查数据库连接
4. 确认 token 有效

### Q2: 工号编辑不生效
**A**:
1. 刷新浏览器（Ctrl+F5）
2. 确认以管理员身份登录
3. 检查 userStore.isAdmin 值

### Q3: 修改工号后用户登录失败
**A**:
- 工号（username）是登录凭证
- 修改后需要使用新工号登录
- 建议同步更新相关文档
