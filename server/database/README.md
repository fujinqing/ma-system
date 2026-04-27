# 数据库初始化说明

## 概述
本文档说明如何初始化曼弗莱德智能制造系统的数据库。

## 前置条件
1. 已安装 SQL Server
2. 已安装 Node.js
3. 已安装 mssql 包（`npm install mssql`）

## 数据库配置

在 `server/config/database.js` 中配置数据库连接：

```javascript
const config = {
  user: 'sa',
  password: 'YourPassword123',
  server: 'localhost',
  database: 'M-A_System',
  trustServerCertificate: true
}
```

## 初始化方法

### 方法一：使用批处理脚本（推荐）

1. 修改 `init.bat` 中的数据库配置
2. 双击运行 `init.bat`
3. 等待初始化完成

### 方法二：使用 Node.js 脚本

```bash
cd server/database
node run_init.js
```

### 方法三：直接在 SQL Server Management Studio 中执行

1. 打开 SQL Server Management Studio
2. 连接到数据库服务器
3. 打开 `init_database.sql` 文件
4. 执行脚本

## 初始化的表

### 1. sys_departments（部门表）
存储公司组织架构信息，包括：
- 部门编码
- 部门名称
- 部门负责人
- 编制人数
- 实际人数
- 职位列表
- 部门图标和颜色

初始化的部门包括：
1. 总经办
2. 质量安全部
3. 供应链管理部
4. 人事行政部
5. 财务&商务部
6. 铸造事业部
7. 光伏半导体事业部
8. 产品研发部
9. 电池事业部
10. 市场&海外营销部
11. 工程部
12. 项目部

### 2. sys_users（用户表）
存储用户信息，包括：
- 用户名
- 密码（加密）
- 姓名
- 角色
- 所属部门
- 职位
- 联系方式
- 权限配置

## 验证初始化

初始化完成后，可以通过以下方式验证：

1. 在 SQL Server Management Studio 中查询表：
```sql
SELECT * FROM sys_departments;
SELECT * FROM sys_users;
```

2. 访问系统前端：
   - 打开浏览器访问系统
   - 进入"系统设置" -> "用户管理"
   - 查看树状视图和列表视图中的部门和用户数据

## 注意事项

1. **密码安全**：初始化脚本中的用户密码需要替换为实际密码
2. **权限配置**：确保数据库用户有足够的权限创建表和插入数据
3. **数据备份**：如果数据库中已有数据，请先备份再执行初始化
4. **连接配置**：确保数据库连接配置正确

## 故障排除

### 问题 1：连接失败
- 检查 SQL Server 服务是否运行
- 检查数据库配置是否正确
- 检查防火墙设置

### 问题 2：表已存在
- 如果是首次初始化，可以忽略该错误
- 如果需要重新初始化，先删除现有表

### 问题 3：权限不足
- 使用具有 db_owner 权限的账户执行脚本
- 或联系数据库管理员授予相应权限

## 联系支持

如有问题，请联系系统管理员。
