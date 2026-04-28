---
name: "monitoring-logging"
description: "Monitoring and logging skill for system observability. Invoke when user needs log analysis, performance monitoring, or error tracking."
---

# Monitoring & Logging Skill

System observability skill for M-A System enterprise management platform.

## Logging Patterns

### Express Logging Middleware
```javascript
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });
  next();
};
```

### Winston Logger
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Log Levels

| Level | Usage |
|-------|-------|
| error | Errors and exceptions |
| warn | Warnings and deprecations |
| info | Important events |
| http | HTTP requests |
| debug | Detailed debugging |

## Monitoring Metrics

### Key Metrics
- **Response Time**: Average/P95/P99 latency
- **Error Rate**: 4xx/5xx responses
- **Throughput**: Requests per second
- **Availability**: Uptime percentage

### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    timestamp: new Date().toISOString()
  };
  res.json(health);
});
```

## Performance Monitoring

### Node.js Metrics
```javascript
const os = require('os');

setInterval(() => {
  const memory = {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem()
  };
  const cpu = os.loadavg();
  console.log({ memory, cpu, timestamp: Date.now() });
}, 60000);
```

### Express Metrics
```javascript
const responseTime = require('response-time');
app.use(responseTime());
```

## Error Tracking

### Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
  console.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message
  });
};
```

## Usage

Invoke this skill when:
- User needs log analysis
- User wants error tracking
- User asks for performance monitoring
- User needs health check implementation