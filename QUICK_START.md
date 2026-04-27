# 快速启动指南

## 第一步：配置数据库

编辑 `server/config/database.js`：

```javascript
const config = {
  user: 'sa',                    // 您的 SQL Server 用户名
  password: 'YourPassword123',   // 您的 SQL Server 密码
  server: 'localhost',           // SQL Server 地址
  database: 'M-A_System',        // 数据库名称
  trustServerCertificate: true
}
```

## 第二步：初始化数据库

### Windows 用户：
```bash
cd server/database
init.bat
```

### 或者使用 Node.js：
```bash
cd server/database
node run_init.js
```

## 第三步：启动后端服务

```bash
cd server
node server.js
```

服务器将在 http://localhost:3005 启动

## 第四步：启动前端服务

```bash
# 在项目根目录
npm run dev
```

前端将在 http://localhost:5173 启动

## 第五步：登录系统

使用默认管理员账户登录：
- **用户名**: zhengfh
- **密码**: (需要在数据库中设置实际密码)

## 验证功能

1. 进入"系统设置" -> "用户管理"
2. 查看树状视图中的组织架构
3. 切换到列表视图查看详细信息
4. 点击"部门管理"按钮可以：
   - 新增部门
   - 编辑部门信息
   - 管理职位设置
   - 删除部门（总经办不可删除）

## 初始组织架构

系统已初始化以下 12 个部门：

1. 📋 总经办 - 郑风华
2. ✅ 质量安全部
3. 🚚 供应链管理部
4. 👥 人事行政部
5. 💰 财务&商务部
6. 🏭 铸造事业部
7. ☀️ 光伏半导体事业部
8. 🔬 产品研发部
9. 🔋 电池事业部
10. 🌍 市场&海外营销部
11. 🔧 工程部
12. 📊 项目部

## 常见问题

### Q: 数据库连接失败？
A: 检查 SQL Server 服务是否运行，确认配置信息正确。

### Q: 初始化脚本报错？
A: 确保已安装 mssql 包：`npm install mssql`

### Q: 前端无法获取部门数据？
A: 确保后端服务已启动，检查浏览器控制台的网络请求。

## 下一步

- 修改默认密码
- 添加实际用户信息
- 配置部门权限
- 自定义部门结构

详细文档请参考：
- [数据库初始化说明](server/database/README.md)
- [实施总结](IMPLEMENTATION_SUMMARY.md)
