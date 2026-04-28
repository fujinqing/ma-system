---
name: "mssql-mcp-server"
description: "MSSQL database MCP server for ma-system. Invoke when user needs database operations, query execution, or MSSQL connection management."
---

# MSSQL MCP Server

MSSQL database Model Context Protocol server for M-A System enterprise management platform.

## Configuration

```json
{
  "mssql": {
    "command": "npx",
    "args": ["-y", "mssql-mcp@latest"],
    "env": {
      "DB_SERVER": "localhost\\TEW_SQLEXPRESS4",
      "DB_PORT": "1433",
      "DB_DATABASE": "M-A_OP_ODB",
      "DB_USER": "sa",
      "DB_PASSWORD": "M-A_SYSTEM_2026",
      "DB_ENCRYPT": "false",
      "DB_TRUST_SERVER_CERTIFICATE": "true",
      "DB_CONNECTION_TIMEOUT": "60000",
      "DB_REQUEST_TIMEOUT": "60000"
    }
  }
}
```

## Database Connection

- **Server**: localhost\\TEW_SQLEXPRESS4
- **Database**: M-A_OP_ODB
- **Port**: 1433
- **Authentication**: SQL Server Authentication

## Supported Operations

- Execute SQL queries
- Manage tables (CREATE, ALTER, DROP)
- CRUD operations on master data
- ETL data synchronization
- Event-driven data sync

## Usage

Invoke this skill when:
- User asks to execute SQL queries
- User needs database schema information
- User wants to sync master data
- User requests ETL operations