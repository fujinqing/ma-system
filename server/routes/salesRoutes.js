const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/auth');

// 销售仪表盘数据
router.get('/dashboard', authenticateToken, salesController.getSalesDashboard);

// 价格计算表
router.get('/price-calculations', authenticateToken, salesController.getPriceCalculations);

// 报价单
router.get('/quotations', authenticateToken, salesController.getQuotations);

// 招投标项目
router.get('/bidding', authenticateToken, salesController.getBiddingProjects);

// 合同
router.get('/contracts', authenticateToken, salesController.getContracts);

// 回款记录
router.get('/payments', authenticateToken, salesController.getPaymentRecords);

module.exports = router;
