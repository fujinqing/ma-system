const express = require('express');
const router = express.Router();
const mfgController = require('../controllers/mfgController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/work-orders', mfgController.getAllWorkOrders);
router.post('/work-orders', mfgController.createWorkOrder);
router.put('/work-orders/:id', mfgController.updateWorkOrder);
router.get('/equipment', mfgController.getAllEquipment);
router.post('/equipment', mfgController.createEquipment);
router.get('/reporting', mfgController.getAllReporting);
router.post('/reporting', mfgController.createReporting);

module.exports = mfgController.router;