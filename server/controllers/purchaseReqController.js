// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const purchaseReqController = {
  // 获取所有采购需求
  getAllRequirements: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        requirements: mockData.purchaseRequirements,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.purchaseRequirements.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取采购需求列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购需求列表失败'));
    }
  },

  // 获取采购需求详情
  getRequirementById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
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

  // 创建采购需求
  createRequirement: async (req, res) => {
    try {
      const { 
        req_code, department_id, project_id, delivery_date, status, 
        total_amount, remark, items 
      } = req.body;
      
      // 使用模拟数据
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
      
      res.json(res.formatResponse(true, { id: newRequirement.id }, '采购需求创建成功'));
    } catch (error) {
      console.error('创建采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购需求失败'));
    }
  },

  // 更新采购需求
  updateRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }
      
      mockData.purchaseRequirements[index] = {
        ...mockData.purchaseRequirements[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '采购需求更新成功'));
    } catch (error) {
      console.error('更新采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购需求失败'));
    }
  },

  // 删除采购需求
  deleteRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }
      
      mockData.purchaseRequirements.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '采购需求删除成功'));
    } catch (error) {
      console.error('删除采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购需求失败'));
    }
  },

  // 提交采购需求
  submitRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }
      
      mockData.purchaseRequirements[index].status = 'submitted';
      mockData.purchaseRequirements[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购需求提交成功'));
    } catch (error) {
      console.error('提交采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '提交采购需求失败'));
    }
  },

  // 审批采购需求
  approveRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseRequirements.findIndex(req => req.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购需求不存在'));
      }
      
      mockData.purchaseRequirements[index].status = 'approved';
      mockData.purchaseRequirements[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购需求审批成功'));
    } catch (error) {
      console.error('审批采购需求失败:', error);
      res.status(500).json(res.formatResponse(false, null, '审批采购需求失败'));
    }
  }
};

module.exports = purchaseReqController;