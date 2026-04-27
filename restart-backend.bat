@echo off
echo ========================================
echo 重启后端服务器
echo ========================================
echo.

echo [1/4] 停止所有 Node 进程...
taskkill /F /IM node.exe
timeout /t 2 /nobreak > nul
echo.

echo [2/4] 检查端口是否释放...
netstat -ano | findstr :3005
if %errorlevel% equ 0 (
    echo 警告：端口 3005 仍被占用，请手动检查
    pause
) else (
    echo 端口 3005 已释放
)
echo.

echo [3/4] 启动后端服务器...
cd /d "%~dp0server"
start "M-A System Backend" cmd /k "npm start"
echo.

echo [4/4] 等待服务器启动...
timeout /t 5 /nobreak > nul
echo.

echo ========================================
echo 服务器启动中...
echo 请在新窗口查看服务器日志
echo ========================================
echo.
echo 提示：
echo 1. 等待看到"服务器运行在 http://localhost:3005"
echo 2. 运行 test_api_positions.js 测试 API
echo 3. 在前端测试职位保存功能
echo.
pause
