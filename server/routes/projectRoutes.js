const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, projectController.getAllProjects);
router.get('/:id', authenticateToken, projectController.getProjectById);
router.post('/', authenticateToken, isAdmin, projectController.createProject);
router.put('/:id', authenticateToken, isAdmin, projectController.updateProject);
router.delete('/:id', authenticateToken, isAdmin, projectController.deleteProject);
router.get('/stats/summary', authenticateToken, projectController.getProjectStats);

module.exports = router;
