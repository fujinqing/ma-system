---
name: "postgresql-mcp-server"
description: "Sets up and manages a PostgreSQL MCP Server for database operations. Invoke when user asks to add PostgreSQL support, configure MCP database server, or migrate/configure PostgreSQL connection."
---

# PostgreSQL MCP Server

This skill helps configure a PostgreSQL MCP (Model Context Protocol) Server for the M-A System project.

## Project Context

**Current Database**: SQL Server (mssql) at `server/config/database.js`
- Server: `localhost\\TEW_SQLEXPRESS4`
- Database: `M-A_OP_ODB`
- Uses `mssql` library with connection pooling

**Existing Tables**:
- `sys_departments` - 部门表
- `sys_users` - 用户表
- `sys_positions` - 职位表
- `sys_teams` - 小组表
- `competitors` - 竞争对手表
- `customers` - 客户表
- `projects` - 项目表
- And many more business tables

## PostgreSQL MCP Server Setup

### Option 1: Using official PostgreSQL MCP Server

```bash
# Install PostgreSQL MCP Server globally
npm install -g @modelcontextprotocol/server-postgres

# Or use npx
npx @modelcontextprotocol/server-postgres
```

### Option 2: Configuration for different tools

**For Claude Desktop** (`~/.config/claude-desktop.json`):
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/ma_system"]
    }
  }
}
```

**For Cursor IDE**:
Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/ma_system"]
    }
  }
}
```

## Connection Configuration

### PostgreSQL Connection String Format
```
postgresql://username:password@host:port/database
```

Example for local development:
```
postgresql://postgres:postgres@localhost:5432/ma_system
```

### Environment Variables (.env)
```
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ma_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

## Database Migration (SQL Server → PostgreSQL)

### Key Differences to Handle

1. **IDENTITY/Auto-increment**
   - SQL Server: `IDENTITY(1,1)`
   - PostgreSQL: `SERIAL` or `GENERATED ALWAYS AS IDENTITY`

2. **NVARCHAR vs VARCHAR**
   - SQL Server: `NVARCHAR`
   - PostgreSQL: `VARCHAR` (or `TEXT`)

3. **GETDATE() vs NOW()**
   - SQL Server: `GETDATE()`
   - PostgreSQL: `NOW()`

4. **TOP vs LIMIT**
   - SQL Server: `SELECT TOP 10 *`
   - PostgreSQL: `SELECT * LIMIT 10`

5. **ROW_NUMBER()**
   - Both supported similarly, but watch for `OVER ()` syntax

### Migration Script Pattern

```sql
-- PostgreSQL migration example for sys_departments
CREATE TABLE sys_departments (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    manager VARCHAR(100),
    headcount INT DEFAULT 0,
    current_staff INT DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'fa fa-building',
    color VARCHAR(20) DEFAULT '#165DFF',
    parent_id INT REFERENCES sys_departments(id),
    level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    positions TEXT,
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INT,
    updated_by INT
);

CREATE INDEX idx_dept_parent ON sys_departments(parent_id);
CREATE INDEX idx_dept_status ON sys_departments(status);
```

## Node.js PostgreSQL Client Setup

### Install pg library
```bash
cd server
npm install pg
```

### Database Config Example (`server/config/postgres.js`)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ma_system',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 100,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 60000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getPool: () => pool,
  closePool: () => pool.end()
};
```

## Usage in Controllers

Replace mssql patterns with pg patterns:

### Before (mssql):
```javascript
const pool = await getPool();
const result = await pool.request()
  .input('id', sql.Int, id)
  .query('SELECT * FROM sys_users WHERE id = @id');
res.json(result.recordset);
```

### After (pg):
```javascript
const { query } = require('../config/postgres');
const result = await query('SELECT * FROM sys_users WHERE id = $1', [id]);
res.json(result.rows);
```

## Troubleshooting

1. **Connection refused**: Ensure PostgreSQL server is running and port 5432 is open
2. **Authentication failed**: Check username/password in connection string
3. **Database does not exist**: Create database first: `CREATE DATABASE ma_system;`
4. **Permission denied**: Grant appropriate privileges: `GRANT ALL PRIVILEGES ON DATABASE ma_system TO postgres;`

## Resources

- [PostgreSQL MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
- [pg npm package](https://www.npmjs.com/package/pg)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
