const express = require('express');
const router = express.Router();
const rdController = require('../controllers/rdController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/projects', rdController.getAllProjects);
router.post('/projects', rdController.createProject);
router.put('/projects/:id', rdController.updateProject);
router.get('/tasks', rdController.getAllTasks);
router.post('/tasks', rdController.createTask);
router.get('/prototypes', rdController.getAllPrototypes);
router.post('/prototypes', rdController.createPrototype);
router.get('/issues', rdController.getAllIssues);
router.post('/issues', rdController.createIssue);

module.exports = rdController.router;