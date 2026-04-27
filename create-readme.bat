@echo off
chcp 65001 >nul
echo ========================================
echo M-A System V1.0 README 创建
echo ========================================
echo.

set README_FILE=D:\M-A_SYSTEM\V1.0\README.md

echo 创建 README.md...
(
echo # M-A System V1.0
echo.
echo M-A 企业管理系统 V1.0 正式版本
echo.
echo ## 系统概述
echo.
echo 本系统是一套完整的企业管理解决方案，包含以下核心模块：
echo.
echo - 项目管理
echo - 采购管理
echo - 销售管理
echo - 客户管理
echo - 库存管理
echo - 人力资源管理
echo - 行政管理
echo - 生产制造
echo - 研发管理
echo - 系统设置（用户管理、部门管理、职位管理）
echo.
echo ## 目录结构
echo.
echo ^^^^
echo V1.0/
echo ├── frontend/          # 前端构建产物（静态文件）
echo │   ├── assets/       # CSS/JS 资源文件
echo │   └── index.html    # 应用入口
echo ├── server/           # 后端 Node.js 服务器
echo │   ├── controllers/  # API 控制器
echo │   ├── routes/       # 路由配置
echo │   ├── middleware/   # 中间件
echo │   ├── config/       # 配置文件
echo │   ├── database/     # 数据库脚本
echo │   └── server.js     # 服务器入口
echo └── README.md         # 本说明文档
echo ^^^^
echo.
echo ## 快速开始
echo.
echo ### 环境要求
echo.
echo - Node.js 16+ 
echo - SQL Server 2016+
echo - npm 或 yarn
echo.
echo ### 1. 安装依赖
echo.
echo ```bash
echo cd server
echo npm install
echo ```
echo.
echo ### 2. 配置数据库
echo.
echo 编辑 `server/config/index.js`：
echo.
echo ```javascript
echo module.exports = {
echo   database: {
echo     user: 'your_username',
echo     password: 'your_password',
echo     server: 'localhost',
echo     database: 'M-A_OP_ODB'
echo   },
echo   jwtSecret: 'your-secret-key',
echo   port: 3005
echo }
echo ```
echo.
echo ### 3. 启动服务器
echo.
echo ```bash
echo cd server
echo npm start
echo ```
echo.
echo 服务器将在 http://localhost:3005 启动
echo.
echo ### 4. 配置 Web 服务器
echo.
echo 使用 Nginx 或 Apache 将 frontend 目录作为静态文件服务器，并配置反向代理到后端 API。
echo.
echo ## 默认账号
echo.
echo - 管理员账号：admin
echo - 初始密码：请联系系统管理员
echo.
echo ## API 文档
echo.
echo 启动服务器后访问：http://localhost:3005/api/info
echo.
echo ## 常见问题
echo.
echo ### Q: 端口 3005 被占用
echo.
echo **解决方案**：
echo ```bash
echo # Windows
echo netstat -ano | findstr :3005
echo taskkill /F /PID ^<进程 ID^>
echo ```
echo.
echo ### Q: 数据库连接失败
echo.
echo 检查项：
echo 1. SQL Server 服务是否运行
echo 2. 数据库 M-A_OP_ODB 是否存在
echo 3. 用户名密码是否正确
echo.
echo ### Q: 前端页面空白
echo.
echo 1. 打开浏览器开发者工具（F12）
echo 2. 查看 Console 错误信息
echo 3. 检查 API 请求是否成功
echo.
echo ## 技术栈
echo.
echo - 前端：Vue 3 + Vite + Element Plus
echo - 后端：Node.js + Express
echo - 数据库：SQL Server
echo - 认证：JWT Token
echo.
echo ## 版本信息
echo.
echo - 版本号：V1.0
echo - 构建日期：%date%
echo - 构建位置：D:\M-A_SYSTEM\V1.0
echo.
echo ========================================
echo 成功：README.md 已创建
echo ========================================
) > "%README_FILE%"

echo.
echo README 文件位置：%README_FILE%
echo.
pause
