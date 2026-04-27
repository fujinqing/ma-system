# M-A System CI/CD 自动化部署指南

## 目录

- [概述](#概述)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [工作流程](#工作流程)
- [手动部署](#手动部署)
- [回滚操作](#回滚操作)
- [监控与告警](#监控与告警)
- [常见问题](#常见问题)

---

## 概述

本项目实现了**全自动化的 CI/CD 流程**，覆盖前端Vue3和后端Node.js服务的构建、测试、部署全链路。

### 核心特性

| 特性 | 说明 |
|------|------|
| 🚀 **自动化构建** | 代码提交自动触发构建，无需人工干预 |
| 🔍 **安全扫描** | 集成依赖漏洞扫描和静态安全分析 |
| ✅ **质量门禁** | ESLint + 测试通过后才允许部署 |
| 🔄 **多环境支持** | 开发/预发布/生产环境独立部署 |
| ⏪ **一键回滚** | 支持快速回滚到上一个稳定版本 |
| 📊 **部署报告** | 每次部署自动生成状态报告 |

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  frontend.yml     │         │  backend.yml      │
        │  前端CI/CD管道     │         │  后端CI/CD管道     │
        └───────────────────┘         └───────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  构建 + 打包       │         │  构建 + 打包       │
        │  npm install      │         │  npm install      │
        │  npm run build    │         │  服务验证          │
        └───────────────────┘         └───────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  部署到 Nginx      │         │  部署到 PM2       │
        │  服务器            │         │  服务管理          │
        └───────────────────┘         └───────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  前端静态资源       │         │  后端API服务       │
        │  /var/www/        │         │  localhost:3001    │
        └───────────────────┘         └───────────────────┘
```

---

## 快速开始

### 1. 配置GitHub Secrets

在 GitHub 仓库的 `Settings → Secrets and variables → Actions` 中添加以下密钥：

#### 必填配置

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `SERVER_HOST` | 生产服务器IP | `192.168.1.100` |
| `SERVER_USER` | 服务器用户名 | `deploy` |
| `SERVER_PASSWORD` | 用户密码或SSH密钥 | `***` |
| `SERVER_PORT` | SSH端口 | `22` |
| `FRONTEND_DEPLOY_PATH` | 前端部署路径 | `/var/www/ma-system` |
| `BACKEND_DEPLOY_PATH` | 后端部署路径 | `/opt/ma-system/backend` |

#### 开发环境配置

| Secret 名称 | 说明 |
|-------------|------|
| `DEV_SERVER_HOST` | 开发服务器IP |
| `DEV_SERVER_USER` | 开发服务器用户名 |
| `DEV_SERVER_PASSWORD` | 开发服务器密码 |
| `DEV_FRONTEND_DEPLOY_PATH` | 开发环境前端路径 |
| `DEV_BACKEND_DEPLOY_PATH` | 开发环境后端路径 |

#### 可选配置

| Secret 名称 | 说明 | 默认值 |
|-------------|------|--------|
| `DEPLOY_COMMAND` | 前端部署后执行的命令 | `sudo systemctl reload nginx` |
| `PM2_CONFIG` | PM2配置文件路径 | `ecosystem.config.js` |
| `BACKEND_PORT` | 后端服务端口 | `3001` |

### 2. 服务器环境准备

```bash
# 在生产服务器上执行

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 创建部署用户
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /var/www/ma-system
sudo chown deploy:deploy /var/www/ma-system

# 配置Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx

# 设置SSH密钥登录（重要！）
# 将GitHub Actions的公钥添加到服务器的authorized_keys
```

### 3. 配置Nginx

```nginx
# /etc/nginx/sites-available/ma-system
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/ma-system/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 工作流程

### 分支策略

```
┌──────────────────────────────────────────────────────────────┐
│                        Git Flow 分支模型                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   feature/xxx  ──►  develop  ──►  main  ──►  生产环境部署       │
│                           │                                   │
│                           └───►  staging (可选) ──► 预发布      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 自动化触发条件

| 事件 | 触发的管道 | 说明 |
|------|-----------|------|
| 推送代码到 `develop` | 前端 + 后端 | 自动部署到开发环境 |
| 推送代码到 `main` | 前端 + 后端 | 自动部署到生产环境 |
| 提交PR到 `main` | 前端 + 后端 | 执行CI检查，不部署 |
| 修改 `src/**` | 前端管道 | 仅前端构建部署 |
| 修改 `server/**` | 后端管道 | 仅后端构建部署 |

### CI/CD 流程详解

#### 1. 前端管道 (frontend.yml)

```
推送代码
    │
    ▼
┌─────────┐
│  Lint   │ ──► ESLint代码规范检查
└─────────┘
    │
    ▼
┌─────────┐
│ Security│ ──► npm audit + Snyk扫描
└─────────┘
    │
    ▼
┌─────────┐
│  Test   │ ──► 运行单元测试
└─────────┘
    │
    ▼
┌─────────┐
│  Build  │ ──► npm run build
└─────────┘
    │
    ▼
┌─────────┐
│ Deploy  │ ──► 部署到服务器
└─────────┘
```

#### 2. 后端管道 (backend.yml)

```
推送代码
    │
    ▼
┌─────────┐
│  Lint   │ ──► ESLint代码规范检查
└─────────┘
    │
    ▼
┌─────────┐
│ Security│ ──► 依赖漏洞扫描
└─────────┘
    │
    ▼
┌─────────┐
│ DB Check│ ──► SQL脚本验证
└─────────┘
    │
    ▼
┌─────────┐
│  Build  │ ──► 打包server.tar.gz
└─────────┘
    │
    ▼
┌─────────┐
│ Deploy  │ ──► 部署+PM2重启+健康检查
└─────────┘
```

---

## 手动部署

### 使用部署脚本

#### 部署前端

```bash
# 设置环境变量
export DEPLOY_HOST="192.168.1.100"
export DEPLOY_USER="deploy"
export DEPLOY_PATH="/var/www/ma-system"

# 执行部署
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh production
```

#### 部署后端

```bash
# 设置环境变量
export DEPLOY_HOST="192.168.1.100"
export DEPLOY_USER="deploy"
export BACKEND_PATH="/opt/ma-system/backend"

# 执行部署
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh production
```

---

## 回滚操作

### 使用回滚脚本

```bash
# 回滚前端
./scripts/rollback.sh frontend production

# 回滚后端
./scripts/rollback.sh backend production

# 回滚全部
./scripts/rollback.sh all production
```

### 自动回滚触发器

当健康检查失败时，系统会自动触发回滚：

```yaml
# 在 GitHub Actions 中配置
jobs:
  deploy:
    ...
    steps:
      - name: 部署
        run: ./scripts/deploy-backend.sh

      - name: 健康检查
        run: |
          for i in {1..5}; do
            if curl -s http://localhost:3001/api/health; then
              exit 0
            fi
            sleep 5
          done
          # 检查失败，触发回滚
          ./scripts/rollback.sh backend production
          exit 1
```

---

## 监控与告警

### 健康检查端点

确保后端实现健康检查接口：

```javascript
// server/routes/health.js
const express = require('express');
const router = express.Router();

router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
```

### PM2 监控

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ma-system-backend

# 查看实时日志
pm2 logs ma-system-backend --f

# 监控资源使用
pm2 monit
```

---

## 常见问题

### Q1: 部署失败 "Permission denied"

**原因**: SSH密钥未配置或权限不足

**解决**:
```bash
# 确保部署用户有sudo权限
sudo usermod -aG sudo deploy

# 配置无密码sudo（用于reload nginx）
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/deploy
```

### Q2: 后端部署后无法启动

**排查步骤**:
```bash
# 1. 检查端口占用
sudo lsof -i :3001

# 2. 检查Node版本
node --version  # 需要 >= 18

# 3. 查看PM2日志
pm2 logs ma-system-backend --lines 100

# 4. 手动测试启动
cd /opt/ma-system/backend/server
node server.js
```

### Q3: 前端构建成功但页面空白

**原因**: 可能是API代理配置问题或路由模式不匹配

**解决**:
```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 确保dist文件存在
ls -la /var/www/ma-system/dist/
```

### Q4: 如何添加新的环境？

**步骤**:
1. 在 GitHub Secrets 添加新环境的配置
2. 修改 workflow 文件，添加新的 job
3. 在服务器创建对应的部署目录
4. 配置 Nginx server block

---

## 附录：文件结构

```
├── .github/
│   └── workflows/
│       ├── frontend.yml      # 前端CI/CD流程
│       └── backend.yml       # 后端CI/CD流程
├── scripts/
│   ├── deploy-frontend.sh    # 前端部署脚本
│   ├── deploy-backend.sh     # 后端部署脚本
│   └── rollback.sh          # 回滚脚本
└── server/
    └── ecosystem.config.js   # PM2配置文件
```

---

## 联系与支持

如有问题，请检查：
1. GitHub Actions 运行日志
2. 服务器系统日志 (`/var/log/syslog`)
3. PM2/ Nginx 错误日志
