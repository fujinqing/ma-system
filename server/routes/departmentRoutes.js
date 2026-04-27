const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取部门列表
router.get('/', departmentController.getAllDepartments);

// 获取部门树形结构
router.get('/tree', departmentController.getDepartmentTree);

// 创建部门
router.post('/', departmentController.createDepartment);

// 更新部门
router.put('/:id', departmentController.updateDepartment);

// 删除部门
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
