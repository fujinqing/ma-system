const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');

const config = require('./config');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const salesRoutes = require('./routes/salesRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const systemRoutes = require('./routes/systemRoutes');
const debugRoutes = require('./routes/debugRoutes');
const hrRoutes = require('./routes/hrRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mfgRoutes = require('./routes/mfgRoutes');
const rdRoutes = require('./routes/rdRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const positionRoutes = require('./routes/positionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const operationLogRoutes = require('./routes/operationLogRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const mdmRoutes = require('./routes/mdmRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const eventBus = require('./services/eventBus');
const mdmEventPublisher = require('./services/mdmEventPublisher');
const eventPublisher = require('./services/eventPublisher');
const { rateLimiter } = require('./middleware/rateLimiter');
const { cache } = require('./middleware/cache');

mdmEventPublisher.setEventBus(eventBus);
eventPublisher.setEventBus(eventBus);

// 创建Express应用
const app = express();

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(cors(config.cors));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// API限流
app.use('/api/', rateLimiter.middleware());

const OperationLog = require('./controllers/operationLogController');

// 请求日志中间件 - 自动记录操作日志
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(body) {
    const duration = Date.now() - start;
    const contentType = res.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let responseData = null;
    if (isJson && body) {
      try {
        responseData = typeof body === 'string' ? JSON.parse(body) : body;
      } catch (e) {
      }
    }

    const skipPaths = ['/api/health', '/api/info', '/api/test'];
    const shouldLog = !skipPaths.some(p => req.path.startsWith(p)) &&
                     req.path.startsWith('/api/');

    if (shouldLog && res.statusCode < 500) {
      const userId = req.user?.id || null;
      const username = req.user?.username || null;
      const userName = req.user?.name || null;

      const module = extractModuleFromPath(req.path);
      const action = `${req.method} ${req.path}`;
      const description = `${req.method} ${req.path} - ${res.statusCode}`;

      OperationLog.log({
        userId,
        username,
        userName,
        action,
        module,
        description,
        details: {
          query: req.query,
          body: req.body && Object.keys(req.body).length > 0 ? req.body : null,
          responseSuccess: responseData?.success
        },
        method: req.method,
        path: req.path,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        duration
      }).catch(err => console.error('Operation log error:', err.message));
    }

    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);

    return originalSend.call(this, body);
  };

  next();
});

function extractModuleFromPath(path) {
  const parts = path.split('/').filter(p => p);
  if (parts.length >= 2) {
    return parts[1];
  }
  return 'unknown';
}

// API响应格式化（支持移动端）
const formatResponse = (success, data, message, pagination = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (pagination) response.pagination = pagination;
  
  return response;
};

// 移动端检测中间件
app.use((req, res, next) => {
  const isMobile = req.headers['x-client-type'] === 'mobile' || 
                   req.headers['user-agent']?.includes('Mobile') ||
                   req.query.mobile === 'true';
  
  req.isMobile = isMobile;
  res.formatResponse = formatResponse;
  req.cache = cache;
  next();
});

// 公开测试路由，不经过权限验证
app.get('/api/test/customers', async (req, res) => {
  console.log('公开测试路由被调用');
  console.log('请求参数:', req.query);
  
  // 生成156个模拟客户数据
  const mockCustomers = [];
  for (let i = 1; i <= 156; i++) {
    mockCustomers.push({
      id: i,
      code: `CUST${String(i).padStart(5, '0')}`,
      name: `客户名称${i}`,
      short_name: `客户${i}`,
      industry: '3c',
      customer_type: 'formal',
      tags: ['end_customer'],
      level: 'normal',
      company_scale: 'medium',
      contact_person: `联系人${i}`,
      contact_phone: `1380013800${String(i).padStart(2, '0')}`,
      sales_id: 1,
      sales_name: '销售经理',
      sales_phone: '13800138000',
      last_contact_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  // 分页
  const paginatedCustomers = mockCustomers.slice(offset, offset + limit);
  const totalCustomers = mockCustomers.length;
  
  // 返回多种格式，确保前端能正确解析
  res.json({
    success: true,
    data: {
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    },
    customers: paginatedCustomers,
    pagination: {
      page,
      limit,
      total: totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit)
    },
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
});

// API 路由
app.use('/api/auth', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mfg', mfgRoutes);
app.use('/api/rd', rdRoutes);
app.use('/api', competitorRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/crm', equipmentRoutes);
app.use('/api/system', operationLogRoutes);
app.use('/api/finance', expenseRoutes);
app.use('/api/mdm', mdmRoutes);
app.use('/api/workflow', workflowRoutes);

// 导入数据库备份工具
const dbBackup = require('./utils/dbBackup');
// 启动主数据同步消费者（监听 customer.* 事件并维护主数据索引）
require('./services/masterDataSync');

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json(formatResponse(true, { 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: {
      size: cache.size(),
      enabled: config.cache.enabled
    },
    rateLimit: rateLimiter.getStats()
  }));
});

// API版本信息
app.get('/api/info', (req, res) => {
  res.json(formatResponse(true, {
    name: 'M-A System API',
    version: '1.0.0',
    description: '曼弗莱德智能制造系统API',
    mobileSupport: true,
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      purchase: '/api/purchase',
      customers: '/api/customers',
      dashboard: '/api/dashboard'
    }
  }));
});

// 404处理
app.use((req, res) => {
  res.status(404).json(formatResponse(false, null, 'API端点不存在'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json(formatResponse(false, null, '服务器内部错误'));
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/info`);
  console.log(`Mobile API ready - supports JSON responses`);
  
  // 启动数据库备份服务
  dbBackup.scheduleBackup(24, 7); // 每24小时备份一次，保留7天

  // 启动操作日志清理服务 - 每24小时清理一次3个月前的日志
  const operationLogCleanup = async () => {
    try {
      const { deleteOldLogs } = require('./controllers/operationLogController');
      const result = await deleteOldLogs(3);
      console.log(`操作日志清理完成: 删除了 ${result.deletedCount} 条 ${result.cutoffDate} 之前的记录`);
    } catch (error) {
      if (error.number === 208 && error.message.includes('sys_operation_logs')) {
        console.log('操作日志表尚未创建，跳过清理任务');
      } else {
        console.error('操作日志清理失败:', error.message);
      }
    }
  };

  // 立即执行一次清理
  operationLogCleanup();

  // 设置定时清理任务 - 每24小时
  setInterval(operationLogCleanup, 24 * 60 * 60 * 1000);
});

module.exports = app;
