// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const purchaseReceiptController = {
  // 获取所有采购入库
  getAllReceipts: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        receipts: mockData.purchaseReceipts,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.purchaseReceipts.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取采购入库列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购入库列表失败'));
    }
  },

  // 获取采购入库详情
  getReceiptById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const receipt = mockData.purchaseReceipts.find(r => r.id === parseInt(id));
      
      if (!receipt) {
        return res.status(404).json(res.formatResponse(false, null, '采购入库不存在'));
      }
      
      res.json(res.formatResponse(true, receipt));
    } catch (error) {
      console.error('获取采购入库详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取采购入库详情失败'));
    }
  },

  // 创建采购入库
  createReceipt: async (req, res) => {
    try {
      const { 
        receipt_code, order_id, warehouse_id, receipt_date, total_quantity,
        status, remark, items 
      } = req.body;
      
      // 使用模拟数据
      const newReceipt = {
        id: mockData.purchaseReceipts.length + 1,
        receipt_code: receipt_code || `RCV-${Date.now()}`,
        order_id,
        warehouse_id,
        receipt_date: receipt_date || new Date().toISOString(),
        total_quantity: total_quantity || 0,
        status: status || 'draft',
        remark,
        items: items || [],
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.purchaseReceipts.push(newReceipt);
      
      res.json(res.formatResponse(true, { id: newReceipt.id }, '采购入库创建成功'));
    } catch (error) {
      console.error('创建采购入库失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建采购入库失败'));
    }
  },

  // 更新采购入库
  updateReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.purchaseReceipts.findIndex(r => r.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购入库不存在'));
      }
      
      mockData.purchaseReceipts[index] = {
        ...mockData.purchaseReceipts[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '采购入库更新成功'));
    } catch (error) {
      console.error('更新采购入库失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新采购入库失败'));
    }
  },

  // 删除采购入库
  deleteReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseReceipts.findIndex(r => r.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购入库不存在'));
      }
      
      mockData.purchaseReceipts.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '采购入库删除成功'));
    } catch (error) {
      console.error('删除采购入库失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除采购入库失败'));
    }
  },

  // 完成采购入库
  completeReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.purchaseReceipts.findIndex(r => r.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '采购入库不存在'));
      }
      
      mockData.purchaseReceipts[index].status = 'completed';
      mockData.purchaseReceipts[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '采购入库完成成功'));
    } catch (error) {
      console.error('完成采购入库失败:', error);
      res.status(500).json(res.formatResponse(false, null, '完成采购入库失败'));
    }
  }
};

module.exports = purchaseReceiptController;