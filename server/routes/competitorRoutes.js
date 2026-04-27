const express = require('express');
const router = express.Router();
const competitorController = require('../controllers/competitorController');
const { authenticateToken } = require('../middleware/auth');

// 获取竞争对手列表
router.get('/competitors', authenticateToken, competitorController.getCompetitors);

// 获取单个竞争对手详情
router.get('/competitors/:id', authenticateToken, competitorController.getCompetitor);

// 创建竞争对手
router.post('/competitors', authenticateToken, competitorController.createCompetitor);

// 更新竞争对手
router.put('/competitors/:id', authenticateToken, competitorController.updateCompetitor);

// 删除竞争对手
router.delete('/competitors/:id', authenticateToken, competitorController.deleteCompetitor);

module.exports = router;