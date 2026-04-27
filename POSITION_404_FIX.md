# 职位管理 404 错误 - 完整解决方案

## 错误信息
```
POST http://localhost:3005/api/positions 404 (Not Found)
```

## 问题诊断

### 可能的原因
1. ❌ **后端服务器未重启** - 最常见原因
2. ❌ **路由文件有语法错误** - 服务器启动失败
3. ❌ **端口被占用** - 服务器未成功启动
4. ❌ **路由未正确注册** - server.js 配置问题

## 完整解决步骤

### 步骤 1：完全停止后端服务器

#### Windows 方法：
```bash
# 方法 A：在运行服务器的命令行窗口按 Ctrl+C

# 方法 B：强制杀死 Node 进程
taskkill /F /IM node.exe
```

### 步骤 2：验证服务器已停止

```bash
# 检查 3005 端口是否还被占用
netstat -ano | findstr :3005
```

如果没有任何输出，说明端口已释放。

### 步骤 3：清理并重启

```bash
cd d:\M-A_SYSTEM\frontend\server

# 清除 node_modules 缓存（可选）
rmdir /s /q node_modules
npm install

# 启动服务器
npm start
```

### 步骤 4：检查启动日志

**应该看到**：
```
服务器运行在 http://localhost:3005
数据库连接成功
```

**不应该看到**：
```
Error: Route.post() requires a callback function
Error: listen EADDRINUSE
Cannot find module './routes/positionRoutes'
```

### 步骤 5：测试 API

#### 方法 A：使用测试脚本
```bash
cd d:\M-A_SYSTEM\frontend\server\database
node test_api_positions.js
```

#### 方法 B：使用浏览器
访问：http://localhost:3005/api/positions

**预期结果**：
```json
{
  "success": true,
  "data": [...]
}
```

### 步骤 6：在前端测试

1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 刷新页面（Ctrl+F5）
3. 进入"系统设置" → "职位管理"
4. 点击"新增职位"
5. 填写信息并保存

## 常见问题排查

### 问题 1：端口被占用
**错误**：`Error: listen EADDRINUSE: address already in use :::3005`

**解决**：
```bash
# 查找占用进程
netstat -ano | findstr :3005

# 杀死进程（替换 PID 为实际进程号）
taskkill /PID <PID> /F

# 重启服务器
cd d:\M-A_SYSTEM\frontend\server
npm start
```

### 问题 2：模块未找到
**错误**：`Cannot find module './routes/positionRoutes'`

**解决**：
```bash
cd d:\M-A_SYSTEM\frontend\server
npm install
```

### 问题 3：路由语法错误
**错误**：`SyntaxError` 或 `TypeError`

**解决**：
检查以下文件：
- `server/routes/positionRoutes.js`
- `server/controllers/positionController.js`

确保没有语法错误。

### 问题 4：数据库表不存在
**错误**：`Invalid object name 'sys_positions'`

**解决**：
```bash
cd d:\M-A_SYSTEM\frontend\server\database
node create_positions.js
```

## 验证清单

重启服务器后，按以下顺序验证：

- [ ] 后端服务器正常启动
- [ ] 没有错误日志
- [ ] GET /api/positions 返回 200
- [ ] POST /api/positions 返回 200
- [ ] 前端可以保存职位

## 快速测试命令

```bash
# 1. 停止所有 Node 进程
taskkill /F /IM node.exe

# 2. 等待 2 秒

# 3. 启动后端服务器
cd d:\M-A_SYSTEM\frontend\server
npm start

# 4. 新开命令行窗口测试 API
cd d:\M-A_SYSTEM\frontend\server\database
node test_api_positions.js
```

## 前端 API 调用说明

**文件**：`src/views/setting/PositionList.vue`

**API 调用**：
```javascript
// 第 368 行
const url = positionForm.id 
  ? `${API_BASE}/positions/${positionForm.id}`
  : `${API_BASE}/positions`;

// API_BASE 定义（第 183 行）
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';
```

**请求头**：
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

## 后端路由配置

**文件**：`server/server.js`

**路由注册**（第 138 行）：
```javascript
app.use('/api/positions', positionRoutes);
```

**路由定义**：`server/routes/positionRoutes.js`
```javascript
router.post('/', auth.authenticateToken, positionController.createPosition);
```

## 成功标志

✅ 后端服务器启动无错误
✅ 访问 http://localhost:3005/api/positions 返回职位列表
✅ 前端保存职位时显示"创建成功"
✅ 数据成功保存到 SQL Server 数据库

## 联系支持

如果以上步骤都无法解决问题，请检查：
1. 后端服务器完整日志
2. 浏览器控制台完整错误信息
3. 数据库连接状态
4. 防火墙设置
