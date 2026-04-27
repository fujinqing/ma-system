@echo off
echo ========================================
echo 测试职位管理 API
echo ========================================
echo.

echo [1/3] 测试 GET 请求...
cd /d "%~dp0server\database"
node test_api_positions.js
echo.

echo [2/3] 测试 POST 请求...
node test_create_position.js
echo.

echo [3/3] 测试 DELETE 请求...
node test_delete_position.js
echo.

echo ========================================
echo 测试完成
echo ========================================
pause
