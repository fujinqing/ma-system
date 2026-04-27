const express = require('express');
const router = express.Router();
const operationLogController = require('../controllers/operationLogController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/operation-logs', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, username, action, module, startDate, endDate, keyword } = req.query;

    const result = await operationLogController.getLogs(
      {
        userId: userId ? parseInt(userId) : null,
        username,
        action,
        module,
        startDate,
        endDate,
        keyword
      },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json(res.formatResponse(true, result.logs, null, result.pagination));
  } catch (error) {
    console.error('Get operation logs error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取操作日志失败'));
  }
});

router.get('/operation-logs/statistics', isAdmin, async (req, res) => {
  try {
    const result = await operationLogController.getStatistics();
    res.json(res.formatResponse(true, result));
  } catch (error) {
    console.error('Get operation log statistics error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取操作日志统计失败'));
  }
});

router.delete('/operation-logs/cleanup', isAdmin, async (req, res) => {
  try {
    const { months = 3 } = req.query;
    const result = await operationLogController.deleteOldLogs(parseInt(months));
    res.json(res.formatResponse(true, result, `已清理 ${result.deletedCount} 条 ${months} 个月前的操作日志`));
  } catch (error) {
    console.error('Cleanup operation logs error:', error);
    res.status(500).json(res.formatResponse(false, null, '清理操作日志失败'));
  }
});

module.exports = router;
