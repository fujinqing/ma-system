@echo off
chcp 65001 >nul
echo ========================================
echo 曼弗莱德智能制造系统 - 数据库初始化
echo ========================================
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [信息] 开始初始化数据库...
echo.

REM 设置数据库配置环境变量
set DB_USER=sa
set DB_PASSWORD=YourPassword123
set DB_SERVER=localhost
set DB_NAME=M-A_System

echo [信息] 数据库配置:
echo   - 服务器：%DB_SERVER%
echo   - 数据库：%DB_NAME%
echo   - 用户：%DB_USER%
echo.

REM 执行初始化脚本
node "%~dp0run_init.js"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 数据库初始化成功完成！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 数据库初始化失败，请检查错误信息
    echo ========================================
)

pause
