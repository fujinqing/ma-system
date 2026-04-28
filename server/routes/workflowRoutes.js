const express = require('express');
const router = express.Router();
const {
  flowController,
  instanceController,
  approvalController,
  todoController,
  bindingController
} = require('../controllers/workflowController');

router.post('/flows', flowController.createFlow);
router.get('/flows', flowController.getFlowList);
router.get('/flows/:id', flowController.getFlow);
router.put('/flows/:id', flowController.updateFlow);
router.delete('/flows/:id', flowController.deleteFlow);
router.post('/flows/:id/enable', flowController.enableFlow);
router.post('/flows/:id/disable', flowController.disableFlow);
router.post('/flows/:id/freeze', flowController.freezeFlow);
router.post('/flows/:id/reactivate', flowController.reactivateFlow);
router.post('/flows/:id/copy', flowController.copyFlow);
router.get('/flows/:id/versions', flowController.getFlowVersions);
router.post('/flows/:id/rollback/:version', flowController.rollbackFlow);

router.post('/approval-groups', flowController.createApprovalGroup);
router.get('/approval-groups', flowController.getApprovalGroups);

router.post('/node-templates', flowController.createNodeTemplate);
router.get('/node-templates', flowController.getNodeTemplates);

router.post('/instances/start', instanceController.startFlow);
router.post('/instances/start-async', instanceController.startFlowAsync);
router.get('/instances/async/:task_id/status', instanceController.getAsyncTaskStatus);
router.get('/instances', instanceController.getInstanceList);
router.get('/instances/stats', instanceController.getInstanceStats);
router.get('/instances/:id', instanceController.getInstance);
router.get('/instances/:id/logs', instanceController.getInstanceLogs);
router.post('/instances/:id/terminate', instanceController.terminateInstance);
router.post('/instances/:id/force-approve', instanceController.forceApproveInstance);
router.post('/instances/:id/cancel', instanceController.cancelInstance);

router.get('/validate-binding/:flow_code/:module_code', instanceController.validateModuleBinding);

router.post('/approvals/:id/approve', approvalController.approve);
router.post('/approvals/:id/reject', approvalController.reject);
router.post('/approvals/:id/transfer', approvalController.transfer);
router.post('/approvals/:id/consult', approvalController.consult);
router.post('/approvals/:id/add-sign', approvalController.addSign);
router.get('/approvals/:id/detail', approvalController.getDetail);
router.get('/approvals/history', approvalController.getHistory);

router.get('/todos', todoController.getTodoList);

router.get('/bindings/:module_code', bindingController.getBindingsByModule);

module.exports = router;