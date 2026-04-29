const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const customerContractController = require('../controllers/customerContractController');

router.get('/', authenticateToken, customerContractController.getAllContracts);
router.get('/stats', authenticateToken, customerContractController.getContractStatistics);
router.get('/customer/:customerId', authenticateToken, customerContractController.getContractsByCustomer);
router.get('/:id', authenticateToken, customerContractController.getContractById);
router.post('/', authenticateToken, customerContractController.createContract);
router.put('/:id', authenticateToken, customerContractController.updateContract);
router.delete('/:id', authenticateToken, customerContractController.deleteContract);
router.post('/payment-plan', authenticateToken, customerContractController.addPaymentPlan);
router.post('/payment-record', authenticateToken, customerContractController.addPaymentRecord);

module.exports = router;
