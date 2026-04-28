const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, isAdmin, isSalesManager } = require('../middleware/auth');

// 恢复使用原始的客户列表查询函数
router.get('/', authenticateToken, customerController.getAllCustomers);
router.get('/statistics', authenticateToken, customerController.getSalesStatistics);

// 删除全部客户数据（危险操作，仅管理员可用）- 必须放在 /:id 路由之前
router.delete('/all', authenticateToken, isAdmin, customerController.deleteAllCustomers);

// 测试路由 - 必须放在 /:id 路由之前
router.get('/test', authenticateToken, (req, res) => {
  console.log('测试路由被调用');
  res.json(res.formatResponse(true, { message: '测试路由正常工作', params: req.query }));
});

router.get('/:id', authenticateToken, customerController.getCustomerById);
router.post('/', authenticateToken, customerController.createCustomer);
router.put('/:id', authenticateToken, customerController.updateCustomer);
router.delete('/:id', authenticateToken, customerController.deleteCustomer);

router.get('/:customerId/contacts', authenticateToken, customerController.getCustomerContacts);
router.post('/:customerId/contacts', authenticateToken, customerController.addCustomerContact);
router.put('/:customerId/contacts/:contactId', authenticateToken, customerController.updateCustomerContact);
router.delete('/:customerId/contacts/:contactId', authenticateToken, customerController.deleteCustomerContact);

router.get('/:customerId/activities', authenticateToken, customerController.getCustomerActivities);
router.post('/:customerId/activities', authenticateToken, customerController.addCustomerActivity);

router.get('/:customerId/statistics', authenticateToken, customerController.getCustomerStatistics);

// 客户池相关路由
router.post('/:id/claim', authenticateToken, customerController.claimCustomer);
router.post('/:id/assign', authenticateToken, isSalesManager, customerController.assignCustomer);
router.post('/:id/release', authenticateToken, customerController.releaseCustomer);
router.get('/:customerId/pool-logs', authenticateToken, customerController.getCustomerPoolLogs);
router.get('/pool/statistics', authenticateToken, customerController.getCustomerPoolStatistics);

// 客户审批流程路由
router.post('/:id/submit-approval', authenticateToken, customerController.submitCustomerApproval);
router.get('/approvals/list', authenticateToken, customerController.getCustomerApprovalList);

module.exports = router;
