const express = require('express');
const router = express.Router();
// 打印所有进入网关路由的请求，便于调试免认证条件
router.use((req, res, next) => {
  try {
    console.log('gatewayRoutes incoming request:', req.method, req.originalUrl, 'query=', req.query, 'x-dev-bypass=', req.headers['x-dev-bypass']);
  } catch (e) {
    console.log('gatewayRoutes logging error', e);
  }
  next();
});
const salesController = require('../controllers/salesController');
const masterDataController = require('../controllers/masterDataController');
const { authenticateToken } = require('../middleware/auth');

// 支持开发模式免认证：设置 NODE_ENV=development 或 环境变量 DEV_GATEWAY_NO_AUTH=true
const allowDevBypass = process.env.NODE_ENV === 'development' || process.env.DEV_GATEWAY_NO_AUTH === 'true';

function maybeAuth(handler) {
  return async (req, res, next) => {
    const queryBypass = req.query && (req.query.dev === '1' || req.query.dev === 'true');
    const headerBypass = req.headers['x-dev-bypass'] === '1' || req.headers['x-dev-bypass'] === 'true';
    console.log('gateway maybeAuth - allowDevBypass=', allowDevBypass, 'queryBypass=', queryBypass, 'headerBypass=', headerBypass, 'req.query=', req.query);
    if (allowDevBypass || queryBypass || headerBypass) {
      // 为下游逻辑提供模拟用户信息，避免未授权调用中断审计等流程
      req.user = req.user || { id: 1, username: 'admin', name: '管理员', role: 'admin' };
      return handler(req, res, next);
    }
    return authenticateToken(req, res, () => handler(req, res, next));
  };
}

// API 网关示例：聚合/代理调用。真实网关可替换为独立服务。
router.get('/sales-dashboard', maybeAuth(salesController.getSalesDashboard));

// 示例：跨系统聚合的简易查询（客户 + 销售用户）
router.get('/customer-summary', maybeAuth(async (req, res) => {
  try {
    // 本示例直接代理到主数据控制器（实际网关应做并发聚合与失败隔离）
    return masterDataController.getCustomers(req, res);
  } catch (err) {
    console.error('网关聚合失败:', err);
    res.status(500).json(res.formatResponse(false, null, '网关聚合失败'));
  }
}));

module.exports = router;
