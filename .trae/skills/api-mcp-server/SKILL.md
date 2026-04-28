---
name: "api-mcp-server"
description: "API/REST client MCP server. Invoke when user needs to test APIs, make HTTP requests, or debug endpoint connections."
---

# API / REST Client MCP Server

API testing and management skill for M-A System enterprise management platform.

## Configuration

```json
{
  "api": {
    "command": "npx",
    "args": ["-y", "api-mcp-server@latest"]
  }
}
```

## Common API Operations

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Retrieve data |
| POST | Create new resource |
| PUT | Update entire resource |
| PATCH | Partial update |
| DELETE | Remove resource |

### Example API Call (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005/api',
  timeout: 30000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const response = await api.get('/users');
const users = response.data.data;
```

### Example API Call (Node.js)
```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/users',
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
req.end();
```

## ma-system API Endpoints

| Module | Base URL | Description |
|--------|----------|-------------|
| Users | /api/users | User management |
| Departments | /api/departments | Organization |
| Customers | /api/customers | CRM |
| Sales | /api/sales | Sales orders |
| Projects | /api/projects | Project management |
| Purchase | /api/purchase | Procurement |

## API Response Format
```json
{
  "success": true,
  "data": [],
  "message": "success",
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

## Usage

Invoke this skill when:
- User needs to test API endpoints
- User wants to debug HTTP requests
- User needs to make REST calls
- User wants to verify API connectivity