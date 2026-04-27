module.exports = {
  port: process.env.PORT || 3005,
  jwtSecret: process.env.JWT_SECRET || 'manfred-manufacturing-secret-key-2026',
  jwtExpiresIn: '8h',
  refreshTokenExpiresIn: '7d',
  database: {
    server: process.env.DB_SERVER || 'localhost\\TEW_SQLEXPRESS4',
    database: process.env.DB_NAME || 'M-A_OP_ODB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'M-A_SYSTEM_2026',
    authentication: {
      type: 'default'
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectionTimeout: 60000,
      requestTimeout: 60000
    },
    pool: {
      max: 100,
      min: 20,
      idleTimeoutMillis: 300000,
      acquireTimeoutMillis: 60000
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Type'],
    credentials: true,
    maxAge: 86400
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 1000,
    message: '请求过于频繁，请稍后再试'
  },
  upload: {
    maxFileSize: 100 * 1024 * 1024,
    maxFiles: 10,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.dwg', '.step', '.stp'],
    uploadPath: './uploads'
  },
  cache: {
    enabled: true,
    ttl: 300,
    checkPeriod: 60
  }
};
