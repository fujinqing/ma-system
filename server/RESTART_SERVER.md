# 重启后端服务器说明

## 问题原因
后端服务器需要重启才能加载新添加的职位管理路由。

## 重启步骤

### 方法 1：手动重启（推荐）

1. **停止当前运行的服务器**
   - 如果服务器在命令行中运行，按 `Ctrl+C` 停止
   - 如果使用 PM2，运行：`pm2 stop all`

2. **启动服务器**
   ```bash
   cd d:\M-A_SYSTEM\frontend\server
   npm start
   ```

### 方法 2：使用 PM2（如果已安装）

```bash
cd d:\M-A_SYSTEM\frontend\server
pm2 restart all
```

### 方法 3：使用 nodemon（开发环境）

如果安装了 nodemon，可以自动重启：
```bash
cd d:\M-A_SYSTEM\frontend\server
npx nodemon server.js
```

## 验证服务器重启成功

重启后，测试职位管理 API：

```bash
cd d:\M-A_SYSTEM\frontend\server\database
node test_api_positions.js
```

应该看到：
```
状态码：200
✅ API 调用成功！
职位数量：24
```

## 前端也需要重启

如果后端重启后职位管理页面仍然不显示，需要重启前端：

```bash
cd d:\M-A_SYSTEM\frontend
npm run dev
```

## 完整重启流程

1. 停止后端服务器
2. 启动后端服务器
3. 等待后端启动完成（看到 "服务器运行在..." 消息）
4. 测试 API 是否正常
5. 如果前端也在运行，重启前端
6. 在浏览器中访问职位管理页面

## 常见问题

### 问题 1：端口被占用
**错误**：`Error: listen EADDRINUSE: address already in use :::3005`

**解决**：
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3005

# 杀死进程（替换 PID 为实际进程号）
taskkill /PID <PID> /F
```

### 问题 2：权限不足
**错误**：`Error: Permission denied`

**解决**：以管理员身份运行命令行

### 问题 3：模块未找到
**错误**：`Cannot find module './routes/positionRoutes'`

**解决**：
```bash
cd d:\M-A_SYSTEM\frontend\server
npm install
```
