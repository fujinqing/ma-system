---
name: "ci-cd"
description: "CI/CD pipeline skill for automated build, test, and deployment. Invoke when user needs GitHub Actions setup, deployment scripts, or DevOps automation."
---

# CI/CD Pipeline Skill

Continuous Integration and Deployment skill for M-A System enterprise management platform.

## GitHub Actions

### Frontend Workflow
```yaml
name: Frontend CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Backend Workflow
```yaml
name: Backend CI/CD
on:
  push:
    branches: [main]
    paths: ['server/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json
      
      - name: Install dependencies
        working-directory: server
        run: npm ci
      
      - name: Run tests
        working-directory: server
        run: npm test
      
      - name: Deploy
        run: echo "Deploying to server..."
```

## Deployment Scripts

### Backend Deploy
```bash
#!/bin/bash
cd server
npm ci
pm2 restart server
```

### Frontend Deploy
```bash
#!/bin/bash
npm run build
rsync -avz dist/ user@server:/var/www/html/
```

### Database Backup
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="M-A_OP_ODB_$DATE.bak"
sqlcmd -S localhost -U sa -P password -Q "BACKUP DATABASE M-A_OP_ODB TO DISK='$BACKUP_FILE'"
```

## DevOps Commands

| Command | Purpose |
|---------|---------|
| `pm2 start app.js` | Start with PM2 |
| `pm2 restart app` | Restart app |
| `pm2 logs` | View logs |
| `pm2 monit` | Monitor status |
| `npm run build` | Build project |
| `rsync -avz` | Sync files |

## Usage

Invoke this skill when:
- User needs CI/CD pipeline setup
- User wants automated deployment
- User asks for GitHub Actions
- User needs build or test automation