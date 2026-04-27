# M-A System V1.0 打包脚本
# 将前端构建产物复制到 V1.0 目录

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "M-A System V1.0 打包程序" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置路径
$SOURCE = "D:\M-A_SYSTEM\frontend\dist"
$DEST = "D:\M-A_SYSTEM\V1.0\frontend"
$SERVER_SOURCE = "D:\M-A_SYSTEM\frontend\server"
$SERVER_DEST = "D:\M-A_SYSTEM\V1.0\server"

Write-Host "[1/4] 创建目标目录..." -ForegroundColor Yellow
if (!(Test-Path $DEST)) {
    New-Item -ItemType Directory -Path $DEST | Out-Null
}
Write-Host "✓ 前端目录已创建：$DEST" -ForegroundColor Green

if (!(Test-Path (Split-Path $SERVER_DEST))) {
    New-Item -ItemType Directory -Path (Split-Path $SERVER_DEST) | Out-Null
}
Write-Host "✓ 服务器目录已创建" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] 复制前端构建文件..." -ForegroundColor Yellow
Get-ChildItem -Path $SOURCE | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $DEST -Recurse -Force
    Write-Host "  已复制：$($_.Name)" -ForegroundColor Gray
}
Write-Host "✓ 前端文件复制完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] 复制后端服务器文件..." -ForegroundColor Yellow
# 排除 node_modules 和临时文件
$exclude = @('node_modules', 'dist', '.git', '*.log')
Get-ChildItem -Path $SERVER_SOURCE -Recurse | Where-Object {
    $path = $_.FullName
    $exclude | ForEach-Object {
        if ($path -like "*\\$_\\*" -or $path -like "*.$_") {
            return $false
        }
    }
    return $true
} | ForEach-Object {
    $relativePath = $_.FullName.Replace($SERVER_SOURCE, '').TrimStart('\')
    $targetPath = Join-Path $SERVER_DEST $relativePath
    
    if ($_.PSIsContainer) {
        if (!(Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath | Out-Null
        }
    } else {
        $targetDir = Split-Path $targetPath -Parent
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
    }
}
Write-Host "✓ 后端文件复制完成" -ForegroundColor Green
Write-Host ""

Write-Host "[4/4] 创建部署说明文档..." -ForegroundColor Yellow
$readme = @"
# M-A System V1.0 部署说明

## 目录结构

````
V1.0/
├── frontend/          # 前端构建产物（静态文件）
│   ├── assets/       # 资源文件
│   └── index.html    # 入口文件
├── server/           # 后端服务器代码
│   ├── controllers/  # 控制器
│   ├── routes/       # 路由
│   ├── middleware/   # 中间件
│   ├── config/       # 配置文件
│   └── server.js     # 服务器入口
└── README.md         # 本文件
````

## 部署步骤

### 1. 安装 Node.js

确保已安装 Node.js 16+ 版本

### 2. 安装后端依赖

````bash
cd server
npm install
````

### 3. 配置数据库

编辑 `server/config/index.js` 配置 SQL Server 连接

### 4. 启动后端服务器

````bash
cd server
npm start
````

服务器将在 http://localhost:3005 启动

### 5. 配置 Web 服务器

使用 Nginx 或 Apache 将 frontend 目录作为静态文件服务器

#### Nginx 配置示例：

````nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/V1.0/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
````

## 环境变量

### 前端环境变量

创建 `frontend/.env` 文件：

````
VITE_API_URL=http://localhost:3005/api
````

### 后端环境变量

编辑 `server/config/index.js`：

- 数据库连接字符串
- JWT 密钥
- 端口号

## 数据库初始化

运行以下脚本初始化数据库：

````bash
cd server/database
node create_positions.js
````

## 测试

### 测试后端 API

````bash
curl http://localhost:3005/api/health
````

### 测试前端

访问 http://localhost 或配置的域名

## 常见问题

### Q: 端口被占用
A: 修改 `server/server.js` 中的端口号或停止占用端口的进程

### Q: 数据库连接失败
A: 检查 SQL Server 服务是否运行，检查连接字符串

### Q: 前端页面空白
A: 检查浏览器控制台错误，确认 API 地址配置正确

## 技术支持

如有问题，请联系技术支持团队。

## 版本信息

- 版本号：V1.0
- 构建日期：$(Get-Date -Format "yyyy-MM-dd")
- 包含模块：
  - 项目管理
  - 采购管理
  - 销售管理
  - 客户管理
  - 库存管理
  - 人力资源管理
  - 行政管理
  - 生产制造
  - 研发管理
  - 系统设置
"@

$readme | Out-File -FilePath "D:\M-A_SYSTEM\V1.0\README.md" -Encoding UTF8
Write-Host "✓ 部署说明文档已创建" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ 打包完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "打包位置：D:\M-A_SYSTEM\V1.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 在 server 目录运行：npm install" -ForegroundColor White
Write-Host "2. 配置数据库连接" -ForegroundColor White
Write-Host "3. 运行：npm start" -ForegroundColor White
Write-Host ""
