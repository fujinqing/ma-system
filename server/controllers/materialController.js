const { getPool } = require('../config/database');
const mdmMaterial = require('../services/mdmMaterial');
const eventBus = require('../services/eventBus');
const { eventDefinitions } = require('../services/eventSchema');

const publishMaterialEvent = (action, entityData, operator) => {
  const eventName = eventDefinitions.mdms?.material?.[action];
  if (eventName && eventBus) {
    eventBus.publish(eventName, {
      businessType: 'MATERIAL',
      action,
      entityData,
      operator
    });
  }
};

const materialController = {
  getAllMaterials: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, category, status } = req.query;
      const result = await mdmMaterial.getAll(parseInt(page), parseInt(limit), search, category, status);
      res.json(res.formatResponse(true, {
        materials: result.data,
        pagination: result.pagination
      }));
    } catch (err) {
      console.error('Get materials error:', err);
      res.status(500).json(res.formatResponse(false, null, '获取物料列表失败'));
    }
  },

  getMaterialById: async (req, res) => {
    try {
      const { id } = req.params;
      const material = await mdmMaterial.getById(parseInt(id));

      if (!material) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }

      res.json(res.formatResponse(true, material));
    } catch (err) {
      console.error('Get material error:', err);
      res.status(500).json(res.formatResponse(false, null, '获取物料详情失败'));
    }
  },

  createMaterial: async (req, res) => {
    try {
      const {
        material_code, material_name, material_category, spec, unit,
        cost_price, supplier_id, warehouse_id, stock_warning_num, status
      } = req.body;

      if (!material_code || !material_name) {
        return res.status(400).json(res.formatResponse(false, null, '物料编码和名称不能为空'));
      }

      const newMaterial = await mdmMaterial.create({
        material_code,
        material_name,
        material_category,
        spec,
        unit,
        cost_price,
        supplier_id,
        warehouse_id,
        stock_warning_num,
        status
      });

      publishMaterialEvent('create', newMaterial, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, { material_id: newMaterial.material_id }, '物料创建成功'));
    } catch (err) {
      console.error('Create material error:', err);
      res.status(500).json(res.formatResponse(false, null, '创建物料失败'));
    }
  },

  updateMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existing = await mdmMaterial.getById(parseInt(id));
      if (!existing) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }

      const updated = await mdmMaterial.update(parseInt(id), updateData);

      publishMaterialEvent('update', updated, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, updated, '物料更新成功'));
    } catch (err) {
      console.error('Update material error:', err);
      res.status(500).json(res.formatResponse(false, null, '更新物料失败'));
    }
  },

  deleteMaterial: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await mdmMaterial.getById(parseInt(id));
      if (!existing) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }

      await mdmMaterial.delete(parseInt(id));

      publishMaterialEvent('delete', { material_id: parseInt(id) }, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '物料删除成功'));
    } catch (err) {
      console.error('Delete material error:', err);
      res.status(500).json(res.formatResponse(false, null, '删除物料失败'));
    }
  },

  getMaterialCategories: async (req, res) => {
    try {
      const categories = [
        { id: 1, name: '汽车零部件' },
        { id: 2, name: '电子元器件' },
        { id: 3, name: '机械配件' },
        { id: 4, name: '办公用品' },
        { id: 5, name: '其他' }
      ];

      res.json(res.formatResponse(true, categories));
    } catch (err) {
      console.error('Get material categories error:', err);
      res.status(500).json(res.formatResponse(false, null, '获取物料分类失败'));
    }
  }
};

module.exports = materialController;
