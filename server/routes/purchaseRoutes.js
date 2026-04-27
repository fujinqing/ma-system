const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const materialController = require('../controllers/materialController');
const purchaseReqController = require('../controllers/purchaseReqController');
const purchaseOrderController = require('../controllers/purchaseOrderController');
const purchaseContractController = require('../controllers/purchaseContractController');
const purchaseReceiptController = require('../controllers/purchaseReceiptController');
const purchasePaymentController = require('../controllers/purchasePaymentController');
const supplierEvalController = require('../controllers/supplierEvalController');
const { authenticateToken, isAdmin, isSupervisor } = require('../middleware/auth');

// 供应商路由
router.get('/suppliers', authenticateToken, supplierController.getAllSuppliers);
router.get('/suppliers/:id', authenticateToken, supplierController.getSupplierById);
router.post('/suppliers', authenticateToken, isSupervisor, supplierController.createSupplier);
router.put('/suppliers/:id', authenticateToken, isSupervisor, supplierController.updateSupplier);
router.delete('/suppliers/:id', authenticateToken, isAdmin, supplierController.deleteSupplier);
router.put('/suppliers/:id/qualify', authenticateToken, isSupervisor, supplierController.qualifySupplier);

// 物料路由
router.get('/materials', authenticateToken, materialController.getAllMaterials);
router.get('/materials/:id', authenticateToken, materialController.getMaterialById);
router.post('/materials', authenticateToken, isSupervisor, materialController.createMaterial);
router.put('/materials/:id', authenticateToken, isSupervisor, materialController.updateMaterial);
router.delete('/materials/:id', authenticateToken, isAdmin, materialController.deleteMaterial);
router.get('/materials/categories', authenticateToken, materialController.getMaterialCategories);

// 采购需求路由
router.get('/requirements', authenticateToken, purchaseReqController.getAllRequirements);
router.get('/requirements/:id', authenticateToken, purchaseReqController.getRequirementById);
router.post('/requirements', authenticateToken, purchaseReqController.createRequirement);
router.put('/requirements/:id', authenticateToken, isSupervisor, purchaseReqController.updateRequirement);
router.delete('/requirements/:id', authenticateToken, isAdmin, purchaseReqController.deleteRequirement);
router.put('/requirements/:id/submit', authenticateToken, purchaseReqController.submitRequirement);
router.put('/requirements/:id/approve', authenticateToken, isSupervisor, purchaseReqController.approveRequirement);

// 采购订单路由
router.get('/orders', authenticateToken, purchaseOrderController.getAllOrders);
router.get('/orders/:id', authenticateToken, purchaseOrderController.getOrderById);
router.post('/orders', authenticateToken, isSupervisor, purchaseOrderController.createOrder);
router.put('/orders/:id', authenticateToken, isSupervisor, purchaseOrderController.updateOrder);
router.delete('/orders/:id', authenticateToken, isAdmin, purchaseOrderController.deleteOrder);
router.put('/orders/:id/submit', authenticateToken, isSupervisor, purchaseOrderController.submitOrder);
router.put('/orders/:id/approve', authenticateToken, isAdmin, purchaseOrderController.approveOrder);
router.put('/orders/:id/confirm', authenticateToken, isSupervisor, purchaseOrderController.confirmOrder);

// 采购合同路由
router.get('/contracts', authenticateToken, purchaseContractController.getAllContracts);
router.get('/contracts/:id', authenticateToken, purchaseContractController.getContractById);
router.post('/contracts', authenticateToken, isSupervisor, purchaseContractController.createContract);
router.put('/contracts/:id', authenticateToken, isSupervisor, purchaseContractController.updateContract);
router.delete('/contracts/:id', authenticateToken, isAdmin, purchaseContractController.deleteContract);
router.put('/contracts/:id/sign', authenticateToken, isAdmin, purchaseContractController.signContract);
router.put('/contracts/:id/activate', authenticateToken, isAdmin, purchaseContractController.activateContract);

// 采购入库路由
router.get('/receipts', authenticateToken, purchaseReceiptController.getAllReceipts);
router.get('/receipts/:id', authenticateToken, purchaseReceiptController.getReceiptById);
router.post('/receipts', authenticateToken, purchaseReceiptController.createReceipt);
router.put('/receipts/:id', authenticateToken, isSupervisor, purchaseReceiptController.updateReceipt);
router.delete('/receipts/:id', authenticateToken, isAdmin, purchaseReceiptController.deleteReceipt);
router.put('/receipts/:id/complete', authenticateToken, purchaseReceiptController.completeReceipt);

// 采购付款路由
router.get('/payments', authenticateToken, purchasePaymentController.getAllPayments);
router.get('/payments/:id', authenticateToken, purchasePaymentController.getPaymentById);
router.post('/payments', authenticateToken, isSupervisor, purchasePaymentController.createPayment);
router.put('/payments/:id', authenticateToken, isSupervisor, purchasePaymentController.updatePayment);
router.delete('/payments/:id', authenticateToken, isAdmin, purchasePaymentController.deletePayment);
router.put('/payments/:id/process', authenticateToken, isAdmin, purchasePaymentController.processPayment);
router.put('/payments/:id/complete', authenticateToken, isAdmin, purchasePaymentController.completePayment);

// 供应商评估路由
router.get('/evaluations', authenticateToken, supplierEvalController.getAllEvaluations);
router.get('/evaluations/:id', authenticateToken, supplierEvalController.getEvaluationById);
router.post('/evaluations', authenticateToken, isSupervisor, supplierEvalController.createEvaluation);
router.put('/evaluations/:id', authenticateToken, isSupervisor, supplierEvalController.updateEvaluation);
router.delete('/evaluations/:id', authenticateToken, isAdmin, supplierEvalController.deleteEvaluation);
router.get('/evaluations/supplier/:supplierId', authenticateToken, supplierEvalController.getEvaluationsBySupplier);

module.exports = router;