const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// 公开路由
router.post('/login', userController.login);

// 需要认证的路由
router.get('/users', authenticateToken, userController.getAllUsers);
router.get('/users/sales', authenticateToken, userController.getSalesUsers);
router.post('/users', authenticateToken, userController.createUser);
router.put('/users/:id', authenticateToken, userController.updateUser);
router.delete('/users/:id', authenticateToken, userController.deleteUser);
router.get('/users/current', authenticateToken, userController.getCurrentUser);
router.get('/users/:id', authenticateToken, userController.getUserById);

module.exports = router;
