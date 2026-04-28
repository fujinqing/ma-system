---
name: "vue-development"
description: "Vue.js 3 frontend development skill for ma-system. Invoke when user needs Vue component development, Pinia state management, Vue Router setup, or Element Plus UI implementation."
---

# Vue.js Frontend Development

Vue.js 3 frontend development skill for M-A System enterprise management platform.

## Tech Stack

- **Framework**: Vue 3.3.4 (Composition API)
- **State Management**: Pinia 2.1.6
- **Router**: Vue Router 4.2.4
- **UI Library**: Element Plus 2.3.12
- **HTTP Client**: Axios 1.4.0
- **Build Tool**: Vite 4.4.5

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API 请求封装
│   ├── views/         # 业务模块页面
│   ├── components/    # 公共组件
│   ├── store/         # Pinia 状态管理
│   └── router/        # 路由配置
├── index.html
└── package.json
```

## Key Patterns

### API Request Pattern
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Element Plus Table
```vue
<el-table :data="tableData" stripe>
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="status" label="状态">
    <template #default="{ row }">
      <el-tag :type="row.status === 'active' ? 'success' : 'info'">
        {{ row.status }}
      </el-tag>
    </template>
  </el-table-column>
</el-table>
```

### Pinia Store
```javascript
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    info: null,
    token: null
  }),
  actions: {
    setUser(info) {
      this.info = info;
    }
  }
});
```

## Common Operations

1. **Create new module page**: Add route → Create view → Add API
2. **Add table column**: Edit view file → Add el-table-column
3. **Add form dialog**: Use el-dialog + el-form components
4. **State management**: Create Pinia store → Use in component

## Usage

Invoke this skill when:
- User asks to create new Vue components
- User needs help with Element Plus UI
- User wants to add new routes or pages
- User needs help with Pinia state management