{
  "name": "ma-system-backend",
  "script": "server.js",
  "instances": 1,
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "500M",
  "env": {
    "NODE_ENV": "development",
    "PORT": 3003
  },
  "env_production": {
    "NODE_ENV": "production",
    "PORT": 3001
  },
  "env_staging": {
    "NODE_ENV": "staging",
    "PORT": 3002
  },
  "error_file": "/var/log/ma-system/backend-error.log",
  "out_file": "/var/log/ma-system/backend-out.log",
  "log_date_format": "YYYY-MM-DD HH:mm:ss",
  "merge_logs": true,
  "kill_timeout": 5000,
  "restart_delay": 4000
}
