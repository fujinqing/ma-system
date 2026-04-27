// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const purchaseContractController = {
  // 获取所有采购合同
  getAllContracts: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        contracts: mockData.purchaseContracts,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.purchaseContracts.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取采购合同列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购合同列表失败'));
    }
  },

  // 获取采购合同详情
  getContractById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const contract = mockData.purchaseContracts.find(c => c.id === parseInt(id));
      
      if (!contract) {
        return res.status(404).json(res.formatResponse(false, null, '采购合同不存在'));
      }
      
      res.json(res.formatResponse(true, contract));
    } catch (error) {
      console.error('获取采购合同详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购合同详情失败'));
    }
  },

  // 创建采购合同
  createContract: async (req, res) => {
    try {
      const { 
        contract_code, order_id, supplier_id, start_date, end_date,
        total_amount, contract_file, status, remark 
      } = req.body;
      
      // 使用模拟数据
      const newContract = {
        id: mockData.purchaseContracts.length + 1,
        contract_code: contract_code || `CON-${Date.now()}`,
        order_id,
        supplier_id,
        contract_date: new Date().toISOString(),
        start_date,
        end_date,
        total_amount: total_amount || 0,
        contract_file,
        status: status || 'draft',
        remark,
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.purchaseContracts.push(newContract);
      
      res.json(res.formatResponse(true, { id: newContract.id }, '采购合同创建成功'));
    } catch (error) {
      console.error('创建采购合同失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购合同失败'));
    }
  },

  // 更新采购合同
  updateContract: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.purchaseContracts.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购合同不存在'));
      }
      
      mockData.purchaseContracts[index] = {
        ...mockData.purchaseContracts[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '采购合同更新成功'));
    } catch (error) {
      console.error('更新采购合同失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购合同失败'));
    }
  },

  // 删除采购合同
  deleteContract: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseContracts.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购合同不存在'));
      }
      
      mockData.purchaseContracts.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '采购合同删除成功'));
    } catch (error) {
      console.error('删除采购合同失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购合同失败'));
    }
  },

  // 签署采购合同
  signContract: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseContracts.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购合同不存在'));
      }
      
      mockData.purchaseContracts[index].status = 'signed';
      mockData.purchaseContracts[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购合同签署成功'));
    } catch (error) {
      console.error('签署采购合同失败:', error);
      res.status(500).json(res.formatResponse(false, null, '签署采购合同失败'));
    }
  },

  // 激活采购合同
  activateContract: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseContracts.findIndex(c => c.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购合同不存在'));
      }
      
      mockData.purchaseContracts[index].status = 'active';
      mockData.purchaseContracts[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购合同激活成功'));
    } catch (error) {
      console.error('激活采购合同失败:', error);
      res.status(500).json(res.formatResponse(false, null, '激活采购合同失败'));
    }
  }
};

module.exports = purchaseContractController;