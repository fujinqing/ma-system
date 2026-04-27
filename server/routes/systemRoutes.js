const express = require('express');
const router = express.Router();
const { cache } = require('../middleware/cache');
const { rateLimiter } = require('../middleware/rateLimiter');
const AuditLog = require('../middleware/auditLog');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/stats', authenticateToken, isAdmin, (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json(res.formatResponse(true, {
    uptime: process.uptime(),
    memory: {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    cache: {
      size: cache.size(),
      enabled: true
    },
    rateLimit: rateLimiter.getStats()
  }));
});

router.get('/audit-logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    
    const result = await AuditLog.getLogs(
      { userId: userId ? parseInt(userId) : null, action, startDate, endDate },
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    res.json(res.formatResponse(true, result.logs, null, result.pagination));
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取审计日志失败'));
  }
});

module.exports = router;
