const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取所有团队
router.get('/', teamController.getAllTeams);

// 获取部门的团队
router.get('/department/:departmentId', teamController.getTeamsByDepartment);

// 获取团队成员
router.get('/:teamId/members', teamController.getTeamMembers);

// 获取组织树（包含部门、小组、人员）
router.get('/organization/tree', teamController.getOrganizationTree);

// 将用户分配到团队
router.post('/assign', teamController.assignUserToTeam);

// 创建团队
router.post('/', teamController.createTeam);

// 更新团队
router.put('/:id', teamController.updateTeam);

// 删除团队
router.delete('/:id', teamController.deleteTeam);

// 更新团队成员数
router.put('/:id/count', teamController.updateTeamCount);

module.exports = router;
