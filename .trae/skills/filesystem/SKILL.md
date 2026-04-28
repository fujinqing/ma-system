---
name: "filesystem"
description: "File system operations MCP server. Invoke when user needs to read, write, search files, or manage project directory structure."
---

# File System MCP Server

File system operations skill for M-A System enterprise management platform.

## Configuration

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem@latest"],
    "env": {
      "ALLOWED_DIRECTORIES": "D:\\M-A_SYSTEM\\frontend"
    }
  }
}
```

## Project Structure

```
ma-system/
├── frontend/                 # 前端项目 (Vue 3)
│   ├── src/
│   │   ├── api/            # API 请求
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── store/          # Pinia 状态
│   │   └── router/         # 路由配置
│   ├── server/             # 后端服务 (Node.js)
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── routes/         # 路由
│   │   ├── middleware/      # 中间件
│   │   └── services/       # 服务层
│   └── .trae/skills/       # Skills 配置
└── docs/                   # 项目文档
```

## Common Operations

### Read File
```javascript
const fs = require('fs');
const content = fs.readFileSync('path/to/file', 'utf8');
```

### Write File
```javascript
const fs = require('fs');
fs.writeFileSync('path/to/file', 'content', 'utf8');
```

### List Directory
```javascript
const fs = require('fs');
const files = fs.readdirSync('path/to/dir');
```

### File Stats
```javascript
const fs = require('fs');
const stats = fs.statSync('path/to/file');
console.log('Size:', stats.size);
console.log('Modified:', stats.mtime);
```

### Search Files
```javascript
const glob = require('glob');
const files = glob.sync('**/*.js', { cwd: 'src' });
```

## File Patterns

| Pattern | Description |
|---------|-------------|
| `*` | Match any characters |
| `**/*.js` | All JS files recursively |
| `src/**/*.vue` | All Vue files in src |
| `!test.js` | Exclude test.js |

## Usage

Invoke this skill when:
- User asks to read or write files
- User needs to search code
- User wants to create directory structure
- User needs file statistics or management