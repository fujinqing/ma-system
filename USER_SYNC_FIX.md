# 用户数据同步修复说明

## 问题描述

系统设置 - 用户管理中，树状视图和列表视图的用户数据不一致，需要：
1. 确保两个视图使用相同的数据源
2. 所有用户数据以 SQL 数据库为准

## 已完成的修复

### 1. 数据源统一

**修复前的问题：**
- 树状视图和列表视图虽然都使用 `this.users` 数组
- 但是从 API 获取数据后，`departmentName` 字段没有正确映射
- 导致列表视图中部门名称显示不正确

**修复内容：**
```javascript
// 在 fetchUsers() 方法中正确映射数据库字段
async fetchUsers() {
  const response = await fetch(`${API_URL}/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const result = await response.json()
  
  this.users = result.data.map(u => ({
    ...u,
    departmentId: u.department_id,      // 映射部门 ID
    departmentName: u.department_name || '',  // 映射部门名称
    permissions: u.permissions || {},
    dataPermission: u.data_permission || null
  }))
}
```

### 2. 用户保存同步到数据库

**修复前的问题：**
- 添加/编辑用户只更新本地数据
- 没有同步到 SQL 数据库

**修复内容：**
```javascript
async saveUser() {
  if (this.isEdit) {
    // 调用 PUT API 更新数据库
    const response = await fetch(`/api/auth/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    })
  } else {
    // 调用 POST API 创建新用户
    const response = await fetch('/api/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    })
  }
  
  // 更新本地数据
  // ...
}
```

### 3. 用户删除同步到数据库

**修复前的问题：**
- 删除用户只从本地数组删除
- 数据库中的记录未删除

**修复内容：**
```javascript
async deleteUser(id) {
  // 调用 DELETE API 从数据库删除
  const response = await fetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const result = await response.json()
  
  if (result.success) {
    // 从本地数组删除
    this.users = this.users.filter(user => user.id !== id)
  }
}
```

### 4. 权限保存同步到数据库

**修复前的问题：**
- 权限设置只保存在本地
- 数据库未更新

**修复内容：**
```javascript
async savePermissions() {
  // 调用 PUT API 更新权限
  const response = await fetch(`/api/auth/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      permissions,
      data_permission: this.dataPermission
    })
  })
  
  // 更新本地数据
}
```

## 数据验证

### 数据库状态
```
总用户数：32

部门分布：
1. 总经办 (2 人) - 郑风华、技术顾问
2. 质量安全部 (4 人)
3. 供应链管理部 (3 人)
4. 人事行政部 (2 人)
5. 财务&商务部 (3 人)
6. 铸造事业部 (3 人)
7. 光伏半导体事业部 (3 人)
8. 产品研发部 (3 人)
9. 电池事业部 (2 人)
10. 市场&海外营销部 (2 人)
11. 工程部 (3 人)
12. 项目部 (2 人)
```

### 验证方法

运行测试脚本验证数据库数据：
```bash
cd server/database
node test_users.js
```

## API 端点

所有用户操作都已实现 RESTful API：

```
GET    /api/auth/users        # 获取用户列表（含部门名称）
POST   /api/auth/users        # 创建用户
PUT    /api/auth/users/:id    # 更新用户
DELETE /api/auth/users/:id    # 删除用户
```

## 数据流程

### 获取用户数据
```
1. 前端调用 /api/auth/users
2. 后端查询 SQL 数据库，关联部门表
3. 返回用户数据（包含 department_name）
4. 前端映射字段：department_id -> departmentId
                  department_name -> departmentName
5. 树状视图和列表视图使用同一数据源
```

### 保存用户数据
```
1. 前端调用 POST/PUT /api/auth/users
2. 后端写入 SQL 数据库
3. 返回操作结果
4. 前端更新本地数据
5. 两个视图自动同步显示
```

## 修复效果

### 修复前
- ❌ 树状视图和列表视图部门名称不一致
- ❌ 添加/编辑用户只保存在本地
- ❌ 删除用户不同步到数据库
- ❌ 权限设置不持久化

### 修复后
- ✅ 树状视图和列表视图完全一致
- ✅ 所有数据以 SQL 数据库为准
- ✅ 添加/编辑用户同步到数据库
- ✅ 删除用户同步到数据库
- ✅ 权限设置同步到数据库
- ✅ 刷新页面数据不丢失

## 测试清单

- [x] 数据库用户数据正确（32 个用户）
- [x] 部门关联正确（12 个部门）
- [x] GET API 返回部门名称
- [x] POST API 创建用户
- [x] PUT API 更新用户
- [x] DELETE API 删除用户
- [x] 前端字段映射正确
- [x] 树状视图显示正确
- [x] 列表视图显示正确
- [x] 两个视图数据一致

## 注意事项

1. **默认密码**：新用户创建时使用默认密码 `default123`
2. **密码加密**：需要在后续实现 bcrypt 加密
3. **字段映射**：数据库字段（snake_case）映射到前端（camelCase）
4. **错误处理**：所有 API 调用都有 try-catch 错误处理
5. **数据一致性**：本地数据和数据库保持同步

## 相关文件

### 前端文件
- `src/views/setting/UserList.vue` - 用户管理页面（已修复）

### 后端文件
- `server/controllers/userController.js` - 用户控制器
- `server/routes/userRoutes.js` - 用户路由

### 测试文件
- `server/database/test_users.js` - 用户数据测试脚本

## 总结

通过本次修复：
1. ✅ 统一了树状视图和列表视图的数据源
2. ✅ 实现了用户数据的完整 CRUD 操作
3. ✅ 确保所有数据以 SQL 数据库为准
4. ✅ 添加了完善的错误处理
5. ✅ 提供了数据验证工具

现在系统中的所有用户数据都存储在 SQL Server 数据库中，前端两个视图完全一致，数据操作实时同步到数据库。

---

**修复时间**: 2026-03-28  
**状态**: ✅ 已完成并验证
