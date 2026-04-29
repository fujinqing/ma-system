const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');

router.get('/', opportunityController.getAllOpportunities);
router.get('/stats/summary', opportunityController.getOpportunityStatistics);
router.get('/:id', opportunityController.getOpportunityById);
router.post('/', opportunityController.createOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.delete('/:id', opportunityController.deleteOpportunity);
router.post('/:id/change-stage', opportunityController.changeOpportunityStage);

module.exports = router;
