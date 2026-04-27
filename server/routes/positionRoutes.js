const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const auth = require('../middleware/auth');

// 获取所有职位
router.get('/', positionController.getPositions);

// 按部门获取职位
router.get('/department/:departmentId', positionController.getPositionsByDepartment);

// 同步用户职位到职位表
router.post('/sync-from-users', auth.authenticateToken, positionController.syncPositionsFromUsers);

// 获取职位详情
router.get('/:id', positionController.getPositionById);

// 创建职位
router.post('/', auth.authenticateToken, positionController.createPosition);

// 更新职位
router.put('/:id', auth.authenticateToken, positionController.updatePosition);

// 删除职位
router.delete('/:id', auth.authenticateToken, positionController.deletePosition);

module.exports = router;
