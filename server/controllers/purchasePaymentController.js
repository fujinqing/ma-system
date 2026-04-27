// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const purchasePaymentController = {
  // 获取所有采购付款
  getAllPayments: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        payments: mockData.purchasePayments,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.purchasePayments.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取采购付款列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购付款列表失败'));
    }
  },

  // 获取采购付款详情
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const payment = mockData.purchasePayments.find(p => p.id === parseInt(id));
      
      if (!payment) {
        return res.status(404).json(res.formatResponse(false, null, '采购付款不存在'));
      }
      
      res.json(res.formatResponse(true, payment));
    } catch (error) {
      console.error('获取采购付款详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购付款详情失败'));
    }
  },

  // 创建采购付款
  createPayment: async (req, res) => {
    try {
      const { 
        payment_code, order_id, contract_id, payment_date, payment_amount,
        payment_method, payment_status, payment_reference, remark 
      } = req.body;
      
      // 使用模拟数据
      const newPayment = {
        id: mockData.purchasePayments.length + 1,
        payment_code: payment_code || `PMT-${Date.now()}`,
        order_id,
        contract_id,
        payment_date: payment_date || new Date().toISOString(),
        payment_amount: payment_amount || 0,
        payment_method,
        payment_status: payment_status || 'pending',
        payment_reference,
        remark,
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.purchasePayments.push(newPayment);
      
      res.json(res.formatResponse(true, { id: newPayment.id }, '采购付款创建成功'));
    } catch (error) {
      console.error('创建采购付款失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购付款失败'));
    }
  },

  // 更新采购付款
  updatePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.purchasePayments.findIndex(p => p.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购付款不存在'));
      }
      
      mockData.purchasePayments[index] = {
        ...mockData.purchasePayments[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '采购付款更新成功'));
    } catch (error) {
      console.error('更新采购付款失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购付款失败'));
    }
  },

  // 删除采购付款
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchasePayments.findIndex(p => p.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购付款不存在'));
      }
      
      mockData.purchasePayments.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '采购付款删除成功'));
    } catch (error) {
      console.error('删除采购付款失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购付款失败'));
    }
  },

  // 处理采购付款
  processPayment: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchasePayments.findIndex(p => p.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购付款不存在'));
      }
      
      mockData.purchasePayments[index].payment_status = 'processing';
      mockData.purchasePayments[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购付款处理中'));
    } catch (error) {
      console.error('处理采购付款失败:', error);
      res.status(500).json(res.formatResponse(false, null, '处理采购付款失败'));
    }
  },

  // 完成采购付款
  completePayment: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchasePayments.findIndex(p => p.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购付款不存在'));
      }
      
      mockData.purchasePayments[index].payment_status = 'completed';
      mockData.purchasePayments[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购付款完成成功'));
    } catch (error) {
      console.error('完成采购付款失败:', error);
      res.status(500).json(res.formatResponse(false, null, '完成采购付款失败'));
    }
  }
};

module.exports = purchasePaymentController;