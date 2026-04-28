const eventBus = require('../services/eventBus');
const { eventDefinitions } = require('../services/eventSchema');

const publishPurchaseReqEvent = (action, entityData, operator) => {
  const eventName = eventDefinitions.srm?.purchase?.[action];
  if (eventName && eventBus) {
    eventBus.publish(eventName, {
      businessType: 'PURCHASE_REQUIREMENT',
      action,
      entityData,
      operator
    });
  }
};

const purchaseReqController = {
  getAllRequirements: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, department_id } = req.query;
      const offset = (page - 1) * limit;

      let filtered = [...mockData.purchaseRequirements];
      if (status) {
        filtered = filtered.filter(r => r.status === status);
      }
      if (department_id) {
        filtered = filtered.filter(r => r.department_id === parseInt(department_id));
      }

      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + parseInt(limit));

      res.json(res.formatResponse(true, {
        requirements: paginated,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }));
    } catch (error) {
      console.error('获取采购需求列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购需求列表失败'));
    }
  },

  getRequirementById: async (req, res) => {
    try {
      const { id } = req.params;
      const requirement = mockData.purchaseRequirements.find(req => req.id === parseInt(id));

      if (!requirement) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }

      res.json(res.formatResponse(true, requirement));
    } catch (error) {
      console.error('获取采购需求详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购需求详情失败'));
    }
  },

  createRequirement: async (req, res) => {
    try {
      const {
        req_code, department_id, project_id, delivery_date, status,
        total_amount, remark, items
      } = req.body;

      const newRequirement = {
        id: mockData.purchaseRequirements.length + 1,
        req_code: req_code || `REQ-${Date.now()}`,
        department_id,
        project_id,
        requester_id: req.user?.id || 1,
        req_date: new Date().toISOString(),
        delivery_date,
        status: status || 'draft',
        total_amount: total_amount || 0,
        remark,
        items: items || [],
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockData.purchaseRequirements.push(newRequirement);

      publishPurchaseReqEvent('create', newRequirement, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, { id: newRequirement.id }, '采购需求创建成功'));
    } catch (error) {
      console.error('创建采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购需求失败'));
    }
  },

  updateRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }

      mockData.purchaseRequirements[index] = {
        ...mockData.purchaseRequirements[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };

      publishPurchaseReqEvent('update', mockData.purchaseRequirements[index], { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '采购需求更新成功'));
    } catch (error) {
      console.error('更新采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购需求失败'));
    }
  },

  deleteRequirement: async (req, res) => {
    try {
      const { id } = req.params;

      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }

      const deleted = mockData.purchaseRequirements.splice(index, 1)[0];

      publishPurchaseReqEvent('delete', { id: parseInt(id) }, { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '采购需求删除成功'));
    } catch (error) {
      console.error('删除采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购需求失败'));
    }
  },

  submitRequirement: async (req, res) => {
    try {
      const { id } = req.params;

      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }

      mockData.purchaseRequirements[index].status = 'submitted';
      mockData.purchaseRequirements[index].updated_at = new Date().toISOString();

      publishPurchaseReqEvent('submit', mockData.purchaseRequirements[index], { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '采购需求提交成功'));
    } catch (error) {
      console.error('提交采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '提交采购需求失败'));
    }
  },

  approveRequirement: async (req, res) => {
    try {
      const { id } = req.params;

      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }

      mockData.purchaseRequirements[index].status = 'approved';
      mockData.purchaseRequirements[index].updated_at = new Date().toISOString();

      publishPurchaseReqEvent('approve', mockData.purchaseRequirements[index], { userId: req.user?.id, userName: req.user?.name });

      res.json(res.formatResponse(true, null, '采购需求审批成功'));
    } catch (error) {
      console.error('审批采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '审批采购需求失败'));
    }
  }
};

module.exports = purchaseReqController;