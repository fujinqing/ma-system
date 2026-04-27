const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/vehicles', adminController.getAllVehicles);
router.post('/vehicles', adminController.createVehicle);
router.put('/vehicles/:id', adminController.updateVehicle);
router.delete('/vehicles/:id', adminController.deleteVehicle);
router.get('/supplies', adminController.getAllSupplies);
router.post('/supplies', adminController.createSupply);
router.put('/supplies/:id', adminController.updateSupply);
router.delete('/supplies/:id', adminController.deleteSupply);
router.get('/announcements', adminController.getAllAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.put('/announcements/:id', adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);
router.get('/assets', adminController.getAllAssets);
router.post('/assets', adminController.createAsset);
router.put('/assets/:id', adminController.updateAsset);
router.delete('/assets/:id', adminController.deleteAsset);

module.exports = adminController.router;