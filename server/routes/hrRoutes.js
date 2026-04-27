const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/employees', hrController.getAllEmployees);
router.get('/employees/:id', hrController.getEmployeeById);
router.put('/employees/:id', hrController.updateEmployee);
router.delete('/employees/:id', hrController.deleteEmployee);

module.exports = hrController.router;