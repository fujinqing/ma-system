---
name: "nodejs-backend"
description: "Node.js/Express backend development for ma-system. Invoke when user needs API development, route configuration, middleware setup, or Express server implementation."
---

# Node.js Backend Development

Node.js/Express backend development skill for M-A System enterprise management platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Database**: MSSQL (mssql@10.0.0)
- **Authentication**: JWT (jsonwebtoken@9.0.2)
- **Security**: Helmet 7.1.0, CORS, bcrypt

## Project Structure

```
server/
├── config/
│   ├── database.js    # MSSQL 连接池
│   └── index.js       # 系统配置
├── controllers/        # 业务控制器
├── routes/            # 路由定义
├── middleware/        # 中间件 (auth, cache, rateLimiter)
├── services/         # 服务层 (eventBus, masterDataSync, ETL)
└── server.js         # 主入口
```

## Key Patterns

### MSSQL Query
```javascript
const db = require('../config/database');

async function getUsers() {
  const pool = await db.getPool();
  const result = await pool.request()
    .query('SELECT * FROM sys_users WHERE status = @status',
      { status: { value: 'active', type: db.sql.NVarChar } });
  return result.recordset;
}
```

### Route Definition
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;
```

### Controller Pattern
```javascript
const getUsers = async (req, res) => {
  try {
    const users = await userService.findAll();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

## Middleware

1. **auth.js** - JWT token verification
2. **cache.js** - In-memory cache
3. **rateLimiter.js** - Request rate limiting
4. **auditLog.js** - Operation logging

## API Response Format
```javascript
{
  success: true,
  data: [],
  message: 'success',
  timestamp: '2026-04-27T10:00:00.000Z'
}
```

## Usage

Invoke this skill when:
- User asks to create new API endpoints
- User needs help with database queries
- User wants to add middleware
- User needs route configuration