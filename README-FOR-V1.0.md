# M-A System V1.0

M-A 企业管理系统 V1.0 正式版本

## 快速开始

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置数据库
编辑 `server/config/index.js` 配置 SQL Server 连接

### 3. 启动服务器
```bash
cd server
npm start
```

服务器将在 http://localhost:3005 启动

### 4. 配置 Web 服务器
使用 Nginx 或 Apache 将 frontend 目录作为静态文件服务器，并配置反向代理到后端 API。

## 目录结构

```
V1.0/
├── frontend/     # 前端静态文件
├── server/       # 后端服务器代码
└── README.md     # 本文件
```

## 默认账号

- 管理员账号：admin
- 初始密码：请联系系统管理员

## 技术栈

- 前端：Vue 3 + Vite + Element Plus
- 后端：Node.js + Express
- 数据库：SQL Server
- 认证：JWT Token

## 常见问题

### 端口被占用
```bash
netstat -ano | findstr :3005
taskkill /F /PID <进程 ID>
```

### 数据库连接失败
检查 SQL Server 服务是否运行，数据库是否存在

## 版本信息

- 版本号：V1.0
- 构建日期：2026-03-28
- 构建位置：D:\M-A_SYSTEM\V1.0
