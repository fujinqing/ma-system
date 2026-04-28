const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWTSECRET = process.env.JWTSECRET || 'M-A-SYSTEM-SECRET-KEY-2026';
const SYSTEM_CONFIG = {
  SOURCE_SYSTEM: 'ma-system',
  TENANT_ID: 'default-tenant',
  EVENT_VERSION: 'v1.0'
};

const app = express();
app.use(express.json());

const services = {
  crm: process.env.CRM_SERVICE_URL || 'http://localhost:3001',
  srm: process.env.SRM_SERVICE_URL || 'http://localhost:3002',
  wms: process.env.WMS_SERVICE_URL || 'http://localhost:3003',
  mes: process.env.MES_SERVICE_URL || 'http://localhost:3004',
  qc: process.env.QC_SERVICE_URL || 'http://localhost:3005',
  hr: process.env.HR_SERVICE_URL || 'http://localhost:3006',
  project: process.env.PROJECT_SERVICE_URL || 'http://localhost:3007',
  aftersale: process.env.AFTERSALE_SERVICE_URL || 'http://localhost:3008',
  knowledge: process.env.KNOWLEDGE_SERVICE_URL || 'http://localhost:3009',
  finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3010',
  mdm: process.env.MDM_SERVICE_URL || 'http://localhost:3011'
};

const serviceRoutes = {
  '/api/crm': 'crm',
  '/api/srm': 'srm',
  '/api/warehouse': 'wms',
  '/api/manufacturing': 'mes',
  '/api/quality': 'qc',
  '/api/hr': 'hr',
  '/api/project': 'project',
  '/api/aftersale': 'aftersale',
  '/api/knowledge': 'knowledge',
  '/api/finance': 'finance',
  '/api/master-data': 'mdm'
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});

app.use(globalLimiter);

function generateTraceId() {
  return `trace-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWTSECRET);
    req.user = decoded;
    req.tenantId = decoded.tenantId || SYSTEM_CONFIG.TENANT_ID;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

function tenantIsolation(req, res, next) {
  const tenantId = req.tenantId || req.headers['x-tenant-id'] || SYSTEM_CONFIG.TENANT_ID;
  req.tenantId = tenantId;
  req.traceId = req.headers['x-trace-id'] || generateTraceId();

  res.setHeader('X-Tenant-Id', tenantId);
  res.setHeader('X-Trace-Id', req.traceId);

  console.log(`[Gateway] Tenant: ${tenantId}, Trace: ${req.traceId}, Path: ${req.path}`);
  next();
}

function tracing(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      tenantId: req.tenantId,
      traceId: req.traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || req.connection?.remoteAddress
    };

    console.log(`[Gateway] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Tenant: ${req.tenantId} - Trace: ${req.traceId}`);

    if (duration > 1000) {
      console.warn(`[Gateway] SLOW REQUEST: ${duration}ms for ${req.method} ${req.path}`);
    }
  });

  next();
}

function routeToService(serviceKey, path) {
  const serviceUrl = services[serviceKey];
  if (!serviceUrl) return null;
  return `${serviceUrl}${path.replace(`/api/${serviceKey}`, '')}`;
}

app.use('/api/:service/*', verifyToken, tenantIsolation, tracing, async (req, res) => {
  const { service } = req.params;
  const targetService = serviceRoutes[`/api/${service}`];
  if (!targetService) {
    return res.status(404).json({ code: 404, message: '服务不存在' });
  }
  const targetUrl = routeToService(targetService, req.originalUrl);
  if (!targetUrl) {
    return res.status(503).json({ code: 503, message: '服务暂不可用' });
  }
  console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  res.json({ code: 200, message: '路由转发功能待实现', data: { targetUrl, method: req.method } });
});

app.get('/gateway/health', (req, res) => {
  res.json({
    code: 200,
    service: 'API Gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: SYSTEM_CONFIG.EVENT_VERSION
  });
});

app.get('/gateway/services', (req, res) => {
  res.json({
    code: 200,
    services: Object.keys(services),
    config: services,
    tenantId: SYSTEM_CONFIG.TENANT_ID
  });
});

app.get('/gateway/trace/:traceId', (req, res) => {
  const { traceId } = req.params;
  res.json({
    code: 200,
    message: 'Trace lookup not implemented',
    traceId
  });
});

const PORT = process.env.GATEWAY_PORT || 3000;

function start() {
  app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
    console.log('[API Gateway] Services:', JSON.stringify(services, null, 2));
    console.log(`[API Gateway] Default Tenant: ${SYSTEM_CONFIG.TENANT_ID}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;