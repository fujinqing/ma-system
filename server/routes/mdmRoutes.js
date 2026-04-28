const express = require('express');
const router = express.Router();

const mdmMaterial = require('../services/mdmMaterial');
const mdmCustomer = require('../services/mdmCustomer');
const mdmSupplier = require('../services/mdmSupplier');
const mdmEmployee = require('../services/mdmEmployee');
const mdmEventPublisher = require('../services/mdmEventPublisher');

function formatResponse(data, message = 'success') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

function getOperator(req) {
  return {
    userId: req.body.operator_id || 1,
    userName: req.body.operator_name || 'system',
    ip: req.ip
  };
}

/**
 * @swagger
 * /api/mdm/materials:
 *   get:
 *     summary: 获取物料列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/materials', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await mdmMaterial.getAll(parseInt(page), parseInt(limit), search);
    res.json(formatResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/materials/:id', async (req, res) => {
  try {
    const material = await mdmMaterial.getById(parseInt(req.params.id));
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json(formatResponse(material));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/materials', async (req, res) => {
  try {
    const material = await mdmMaterial.create(req.body);
    mdmEventPublisher.publishMaterialCreate(material, getOperator(req));
    res.json(formatResponse(material, 'Material created successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/materials/:id', async (req, res) => {
  try {
    const material = await mdmMaterial.update(parseInt(req.params.id), req.body);
    mdmEventPublisher.publishMaterialUpdate(material, getOperator(req));
    res.json(formatResponse(material, 'Material updated successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/materials/:id', async (req, res) => {
  try {
    const result = await mdmMaterial.delete(parseInt(req.params.id));
    mdmEventPublisher.publishMaterialDelete(parseInt(req.params.id), getOperator(req));
    res.json(formatResponse(result, 'Material deleted successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await mdmCustomer.getAll(parseInt(page), parseInt(limit), search);
    res.json(formatResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await mdmCustomer.getById(parseInt(req.params.id));
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json(formatResponse(customer));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const customer = await mdmCustomer.create(req.body);
    mdmEventPublisher.publishCustomerCreate(customer, getOperator(req));
    res.json(formatResponse(customer, 'Customer created successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await mdmCustomer.update(parseInt(req.params.id), req.body);
    mdmEventPublisher.publishCustomerUpdate(customer, getOperator(req));
    res.json(formatResponse(customer, 'Customer updated successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const result = await mdmCustomer.delete(parseInt(req.params.id));
    mdmEventPublisher.publishCustomerDelete(parseInt(req.params.id), getOperator(req));
    res.json(formatResponse(result, 'Customer deleted successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/suppliers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await mdmSupplier.getAll(parseInt(page), parseInt(limit), search);
    res.json(formatResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await mdmSupplier.getById(parseInt(req.params.id));
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json(formatResponse(supplier));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await mdmSupplier.create(req.body);
    mdmEventPublisher.publishSupplierCreate(supplier, getOperator(req));
    res.json(formatResponse(supplier, 'Supplier created successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await mdmSupplier.update(parseInt(req.params.id), req.body);
    mdmEventPublisher.publishSupplierUpdate(supplier, getOperator(req));
    res.json(formatResponse(supplier, 'Supplier updated successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const result = await mdmSupplier.delete(parseInt(req.params.id));
    mdmEventPublisher.publishSupplierDelete(parseInt(req.params.id), getOperator(req));
    res.json(formatResponse(result, 'Supplier deleted successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await mdmEmployee.getAllEmployees(parseInt(page), parseInt(limit), search);
    res.json(formatResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await mdmEmployee.getEmployeeById(parseInt(req.params.id));
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json(formatResponse(employee));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const employee = await mdmEmployee.createEmployee(req.body);
    mdmEventPublisher.publishEmployeeCreate(employee, getOperator(req));
    res.json(formatResponse(employee, 'Employee created successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const employee = await mdmEmployee.updateEmployee(parseInt(req.params.id), req.body);
    mdmEventPublisher.publishEmployeeUpdate(employee, getOperator(req));
    res.json(formatResponse(employee, 'Employee updated successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    const result = await mdmEmployee.deleteEmployee(parseInt(req.params.id));
    mdmEventPublisher.publishEmployeeDelete(parseInt(req.params.id), getOperator(req));
    res.json(formatResponse(result, 'Employee deleted successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orgs', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const orgs = await mdmEmployee.getAllOrgs(search);
    res.json(formatResponse(orgs));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orgs/tree', async (req, res) => {
  try {
    const tree = await mdmEmployee.getOrgTree();
    res.json(formatResponse(tree));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/orgs', async (req, res) => {
  try {
    const org = await mdmEmployee.createOrg(req.body);
    mdmEventPublisher.publishOrgCreate(org, getOperator(req));
    res.json(formatResponse(org, 'Organization created successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orgs/:id', async (req, res) => {
  try {
    const org = await mdmEmployee.updateOrg(parseInt(req.params.id), req.body);
    mdmEventPublisher.publishOrgUpdate(org, getOperator(req));
    res.json(formatResponse(org, 'Organization updated successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/orgs/:id', async (req, res) => {
  try {
    const result = await mdmEmployee.deleteOrg(parseInt(req.params.id));
    mdmEventPublisher.publishOrgDelete(parseInt(req.params.id), getOperator(req));
    res.json(formatResponse(result, 'Organization deleted successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sync/hr', async (req, res) => {
  try {
    const { employees = [], orgs = [] } = req.body;
    const result = await mdmEmployee.syncFromHR(employees, orgs);
    mdmEventPublisher.publishEmployeeSync(employees, getOperator(req));
    mdmEventPublisher.publishOrgSync(orgs, getOperator(req));
    res.json(formatResponse(result, 'HR data synced successfully'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
