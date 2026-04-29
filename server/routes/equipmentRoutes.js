const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const equipmentController = require('../controllers/equipmentController');

router.get('/equipment', authenticateToken, equipmentController.getAllEquipment);
router.get('/equipment/stats', authenticateToken, equipmentController.getEquipmentStatistics);
router.get('/equipment/:id', authenticateToken, equipmentController.getEquipmentById);
router.post('/equipment', authenticateToken, equipmentController.createEquipment);
router.put('/equipment/:id', authenticateToken, equipmentController.updateEquipment);
router.delete('/equipment/:id', authenticateToken, equipmentController.deleteEquipment);
router.get('/equipment/:equipmentId/maintenance-records', authenticateToken, equipmentController.getEquipmentMaintenanceRecords);
router.post('/equipment/:equipmentId/maintenance-records', authenticateToken, equipmentController.createMaintenanceRecord);

router.get('/repairs', authenticateToken, equipmentController.getRepairRequests);
router.post('/repairs', authenticateToken, equipmentController.createRepairRequest);

module.exports = router;
