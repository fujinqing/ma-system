# 用户管理模块 - 字段名称修改

## 修改内容

将用户管理模块中的"用户名"字段标签统一修改为"工号"。

## 修改范围

### 前端界面修改

**文件**：`src/views/setting/UserList.vue`

#### 1. 列表视图 - 表格列标签
**位置**：第 111 行

**修改前**：
```vue
<el-table-column prop="username" label="用户名" width="120"></el-table-column>
```

**修改后**：
```vue
<el-table-column prop="username" label="工号" width="120"></el-table-column>
```

#### 2. 表单标签 - 添加/编辑用户
**位置**：第 153 行

**修改前**：
```vue
<el-form-item label="用户名" prop="username">
  <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit"></el-input>
</el-form-item>
```

**修改后**：
```vue
<el-form-item label="工号" prop="username">
  <el-input v-model="userForm.username" placeholder="请输入工号" :disabled="isEdit"></el-input>
</el-form-item>
```

#### 3. 表单验证规则 - 错误提示
**位置**：第 315 行

**修改前**：
```javascript
username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
```

**修改后**：
```javascript
username: [{ required: true, message: '请输入工号', trigger: 'blur' }],
```

## 保持不变的部分

### 1. 数据库字段
- 数据库字段名仍为 `username`
- 不需要修改数据库表结构
- 后端 API 参数名仍为 `username`

### 2. 代码逻辑
- 所有代码逻辑不变
- 变量名不变（`username`）
- API 接口不变

### 3. 后端代码
- 后端控制器无需修改
- 后端 API 响应格式不变

## 修改影响

### 用户可见的变化
1. ✅ 用户列表表格列标题：用户名 → 工号
2. ✅ 添加用户表单标签：用户名 → 工号
3. ✅ 编辑用户表单标签：用户名 → 工号
4. ✅ 表单验证错误提示：用户名 → 工号
5. ✅ 输入框占位符：请输入用户名 → 请输入工号

### 不受影响的部分
- ❌ 数据库字段名（仍为 `username`）
- ❌ 前端变量名（仍为 `username`）
- ❌ API 请求参数（仍为 `username`）
- ❌ 后端代码逻辑

## 业务含义

### 修改原因
- "工号"更符合企业实际使用场景
- "工号"是员工的唯一标识
- 更贴近制造业和企业管理习惯

### 字段说明
- **工号**（username）：员工在公司内部的唯一标识
- 通常格式：字母 + 数字组合
- 例如：ENG001, QA002, MGR001 等

## 测试要点

### 功能测试
- [ ] 用户列表显示正常
- [ ] 添加用户时显示"工号"标签
- [ ] 编辑用户时显示"工号"标签
- [ ] 必填验证提示显示"请输入工号"
- [ ] 工号输入框在编辑时不可修改

### 界面测试
- [ ] 表格列宽度适配
- [ ] 表单布局正常
- [ ] 标签对齐正确
- [ ] 占位符显示正确

### 数据测试
- [ ] 保存用户数据正常
- [ ] 读取用户数据正常
- [ ] 数据库字段无变化
- [ ] API 调用无异常

## 相关文件

### 修改的文件
- ✅ `src/views/setting/UserList.vue` - 用户管理界面

### 无需修改的文件
- ❌ `server/controllers/userController.js` - 后端控制器
- ❌ `server/routes/userRoutes.js` - 路由配置
- ❌ `server/database/` - 数据库脚本

## 回滚方案

如果需要恢复为"用户名"，只需将上述 3 处修改回滚即可：

```bash
# 使用 git 回滚
git checkout HEAD -- src/views/setting/UserList.vue
```

或者手动修改回原来的文本。

## 部署说明

### 开发环境
1. 修改完成后，前端会自动热更新
2. 刷新浏览器即可看到变化
3. 无需重启后端服务器

### 生产环境
1. 重新构建前端：`npm run build`
2. 部署构建产物到服务器
3. 清除 CDN 缓存（如有）

## 成功标志

✅ 用户列表显示"工号"列  
✅ 添加用户表单显示"工号"标签  
✅ 编辑用户表单显示"工号"标签  
✅ 验证提示显示"请输入工号"  
✅ 系统功能正常运行  
✅ 数据保存和读取无异常  

## 注意事项

1. **无需数据库迁移** - 这只是界面标签的修改
2. **无需 API 变更** - 后端接口完全兼容
3. **无需数据同步** - 数据字段名未变化
4. **建议清除缓存** - 确保浏览器加载最新代码
