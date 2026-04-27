const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');

// 主数据公开接口（只读）
router.get('/customers', masterDataController.getCustomers);
router.get('/users', masterDataController.getUsers);
router.get('/suppliers', masterDataController.getSuppliers);
router.get('/md/customers', masterDataController.getMasterCustomers);

module.exports = router;
