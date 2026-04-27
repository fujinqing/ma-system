// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const purchaseOrderController = {
  // 获取所有采购订单
  getAllOrders: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        orders: mockData.purchaseOrders,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.purchaseOrders.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取采购订单列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购订单列表失败'));
    }
  },

  // 获取采购订单详情
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const order = mockData.purchaseOrders.find(o => o.id === parseInt(id));
      
      if (!order) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      res.json(res.formatResponse(true, order));
    } catch (error) {
      console.error('获取采购订单详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购订单详情失败'));
    }
  },

  // 创建采购订单
  createOrder: async (req, res) => {
    try {
      const { 
        order_code, requirement_id, supplier_id, delivery_date, delivery_address,
        payment_terms, currency, total_amount, status, remark, items 
      } = req.body;
      
      // 使用模拟数据
      const newOrder = {
        id: mockData.purchaseOrders.length + 1,
        order_code: order_code || `PO-${Date.now()}`,
        requirement_id,
        supplier_id,
        order_date: new Date().toISOString(),
        delivery_date,
        delivery_address,
        payment_terms,
        currency: currency || 'CNY',
        total_amount: total_amount || 0,
        status: status || 'draft',
        remark,
        items: items || [],
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.purchaseOrders.push(newOrder);
      
      res.json(res.formatResponse(true, { id: newOrder.id }, '采购订单创建成功'));
    } catch (error) {
      console.error('创建采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购订单失败'));
    }
  },

  // 更新采购订单
  updateOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.purchaseOrders.findIndex(o => o.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      mockData.purchaseOrders[index] = {
        ...mockData.purchaseOrders[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '采购订单更新成功'));
    } catch (error) {
      console.error('更新采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购订单失败'));
    }
  },

  // 删除采购订单
  deleteOrder: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseOrders.findIndex(o => o.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      mockData.purchaseOrders.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '采购订单删除成功'));
    } catch (error) {
      console.error('删除采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购订单失败'));
    }
  },

  // 提交采购订单
  submitOrder: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseOrders.findIndex(o => o.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      mockData.purchaseOrders[index].status = 'submitted';
      mockData.purchaseOrders[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购订单提交成功'));
    } catch (error) {
      console.error('提交采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '提交采购订单失败'));
    }
  },

  // 审批采购订单
  approveOrder: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseOrders.findIndex(o => o.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      mockData.purchaseOrders[index].status = 'approved';
      mockData.purchaseOrders[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购订单审批成功'));
    } catch (error) {
      console.error('审批采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '审批采购订单失败'));
    }
  },

  // 确认采购订单
  confirmOrder: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseOrders.findIndex(o => o.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购订单不存在'));
      }
      
      mockData.purchaseOrders[index].status = 'confirmed';
      mockData.purchaseOrders[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购订单确认成功'));
    } catch (error) {
      console.error('确认采购订单失败:', error);
      res.status(500).json(res.formatResponse(false, null, '确认采购订单失败'));
    }
  }
};

module.exports = purchaseOrderController;