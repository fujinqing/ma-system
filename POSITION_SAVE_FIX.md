# 职位保存 API 修复指南

## 问题描述
保存职位时显示"API 端点不存在"错误。

## 问题原因
后端服务器需要重启才能加载新添加的职位管理路由。

## 解决方案

### 步骤 1：重启后端服务器（必须）

#### 方法 A：直接重启
```bash
cd d:\M-A_SYSTEM\frontend\server
# 如果正在运行，按 Ctrl+C 停止
npm start
```

#### 方法 B：使用 PM2（如果已安装）
```bash
cd d:\M-A_SYSTEM\frontend\server
pm2 restart all
```

### 步骤 2：验证 API 是否正常

#### 测试 GET 请求
```bash
cd d:\M-A_SYSTEM\frontend\server\database
node test_api_positions.js
```

**预期结果**：
```
状态码：200
✅ API 调用成功！
职位数量：24
```

#### 测试 POST 请求
```bash
cd d:\M-A_SYSTEM\frontend\server\database
node test_create_position.js
```

**预期结果**：
```
状态码：200
✅ 创建职位成功！
```

### 步骤 3：在前端测试保存功能

1. 打开浏览器，访问系统
2. 进入"系统设置" → "职位管理"
3. 点击"新增职位"
4. 填写信息：
   - 职位代码：TEST001
   - 职位名称：测试职位
   - 职位类型：通用职位
5. 点击"确定"

**预期结果**：显示"创建成功"，列表中出现新职位。

## 已验证的配置

### 后端路由配置 ✅
**文件**：`server/server.js`（第 20 行和第 138 行）
```javascript
const positionRoutes = require('./routes/positionRoutes');
app.use('/api/positions', positionRoutes);
```

### 路由定义 ✅
**文件**：`server/routes/positionRoutes.js`
```javascript
// 创建职位
router.post('/', auth, positionController.createPosition);

// 更新职位
router.put('/:id', auth, positionController.updatePosition);
```

### 控制器 ✅
**文件**：`server/controllers/positionController.js`
- `createPosition` - 创建职位
- `updatePosition` - 更新职位
- `deletePosition` - 删除职位

### 前端 API 调用 ✅
**文件**：`src/views/setting/PositionList.vue`
```javascript
const url = positionForm.id 
  ? `${API_BASE}/positions/${positionForm.id}`
  : `${API_BASE}/positions`;

const method = positionForm.id ? 'PUT' : 'POST';
```

## 常见问题

### Q1: 状态码 404 - API 端点不存在
**原因**：后端服务器未重启

**解决**：
```bash
cd d:\M-A_SYSTEM\frontend\server
# 停止当前运行的服务器（Ctrl+C）
npm start
```

### Q2: 状态码 401 - 未授权
**原因**：需要登录获取 token

**解决**：
1. 在前端登录系统
2. 系统会自动在请求头中添加 token
3. 或者使用测试脚本时提供有效 token

### Q3: 端口被占用
**错误**：`Error: listen EADDRINUSE: address already in use :::3005`

**解决**：
```bash
# 查找占用进程
netstat -ano | findstr :3005

# 杀死进程（替换 PID）
taskkill /PID <PID> /F
```

### Q4: 数据库表不存在
**错误**：`Invalid object name 'sys_positions'`

**解决**：
```bash
cd d:\M-A_SYSTEM\frontend\server\database
node create_positions.js
```

## 完整的重启流程

```bash
# 1. 停止后端服务器
# 在运行后端的命令行中按 Ctrl+C

# 2. 重启后端服务器
cd d:\M-A_SYSTEM\frontend\server
npm start

# 3. 等待看到"服务器运行在..."消息

# 4. 新开命令行窗口测试 API
cd d:\M-A_SYSTEM\frontend\server\database
node test_api_positions.js

# 5. 如果 API 正常，在前端测试保存功能
```

## 成功标志

✅ 后端服务器已重启
✅ GET /api/positions 返回 200
✅ POST /api/positions 返回 200
✅ 前端可以成功保存职位
✅ 职位数据保存在 SQL Server 数据库中

## 文件清单

### 后端文件
- ✅ `server/controllers/positionController.js`
- ✅ `server/routes/positionRoutes.js`
- ✅ `server/server.js`
- ✅ `server/database/create_positions_table.sql`
- ✅ `server/database/create_positions.js`

### 前端文件
- ✅ `src/views/setting/PositionList.vue`
- ✅ `src/router/index.js`
- ✅ `src/App.vue`

### 测试文件
- ✅ `server/database/test_api_positions.js` - 测试 GET 请求
- ✅ `server/database/test_create_position.js` - 测试 POST 请求

## 下一步

重启后端服务器后，职位保存功能应该完全正常。如果仍有问题：

1. 检查后端服务器日志
2. 检查浏览器控制台错误
3. 检查数据库连接状态
4. 运行测试脚本验证 API
