const mdmSupplier = require('../services/mdmSupplier');
const eventBus = require('../services/eventBus');
const { eventDefinitions } = require('../services/eventSchema');

const publishSupplierEvent = (action, entityData, operator) => {
  const eventName = eventDefinitions.mdms?.supplier?.[action];
  if (eventName && eventBus) {
    eventBus.publish(eventName, {
      businessType: 'SUPPLIER',
      action,
      entityData,
      operator
    });
  }
};

const supplierController = {
  getAllSuppliers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status, type } = req.query;
      const result = await mdmSupplier.getAll(parseInt(page), parseInt(limit), search, status, type);
      res.json(res.formatResponse(true, {
        suppliers: result.data,
        pagination: result.pagination
      }));
    } catch (err) {
      console.error('Get suppliers error:', err);
      res.status(500).json(res.formatResponse(false, null, '获取供应商列表失败'));
    }
  },

  getSupplierById: async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await mdmSupplier.getById(parseInt(id));

      if (!supplier) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }

      res.json(res.formatResponse(true, supplier));
    } catch (err) {
      console.error('Get supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '获取供应商详情失败'));
    }
  },

  createSupplier: async (req, res) => {
    try {
      const {
        supplier_code, supplier_name, supplier_short_name, supplier_type,
        qualification_level, contact_person, contact_phone, contact_email,
        address, cooperation_status, audit_status, belong_org
      } = req.body;

      if (!supplier_code || !supplier_name) {
        return res.status(400).json(res.formatResponse(false, null, '供应商编码和名称不能为空'));
      }

      const newSupplier = await mdmSupplier.create({
        supplier_code,
        supplier_name,
        supplier_short_name,
        supplier_type,
        qualification_level,
        contact_person,
        contact_phone,
        contact_email,
        address,
        cooperation_status,
        audit_status,
        belong_org
      });

      publishSupplierEvent('create', newSupplier, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, { supplier_id: newSupplier.supplier_id }, '供应商创建成功'));
    } catch (err) {
      console.error('Create supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '创建供应商失败'));
    }
  },

  updateSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existing = await mdmSupplier.getById(parseInt(id));
      if (!existing) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }

      const updated = await mdmSupplier.update(parseInt(id), updateData);

      publishSupplierEvent('update', updated, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, updated, '供应商更新成功'));
    } catch (err) {
      console.error('Update supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '更新供应商失败'));
    }
  },

  deleteSupplier: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await mdmSupplier.getById(parseInt(id));
      if (!existing) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }

      await mdmSupplier.delete(parseInt(id));

      publishSupplierEvent('delete', { supplier_id: parseInt(id) }, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '供应商删除成功'));
    } catch (err) {
      console.error('Delete supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '删除供应商失败'));
    }
  },

  qualifySupplier: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await mdmSupplier.getById(parseInt(id));
      if (!existing) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }

      const updated = await mdmSupplier.update(parseInt(id), {
        qualification_level: 'qualified',
        audit_status: 'approved'
      });

      publishSupplierEvent('audit', updated, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, updated, '供应商资格认证成功'));
    } catch (err) {
      console.error('Qualify supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '供应商资格认证失败'));
    }
  }
};

module.exports = supplierController;
