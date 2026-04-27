// const sql = require('mssql');
// const { getPool } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const supplierEvalController = {
  // 获取所有供应商评估
  getAllEvaluations: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        evaluations: mockData.supplierEvaluations,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.supplierEvaluations.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取供应商评估列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取供应商评估列表失败'));
    }
  },

  // 获取供应商评估详情
  getEvaluationById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const evaluation = mockData.supplierEvaluations.find(e => e.id === parseInt(id));
      
      if (!evaluation) {
        return res.status(404).json(res.formatResponse(false, null, '供应商评估不存在'));
      }
      
      res.json(res.formatResponse(true, evaluation));
    } catch (error) {
      console.error('获取供应商评估详情失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取供应商评估详情失败'));
    }
  },

  // 创建供应商评估
  createEvaluation: async (req, res) => {
    try {
      const { 
        supplier_id, quality_score, delivery_score, price_score, 
        service_score, evaluator_id, remark 
      } = req.body;
      
      // 计算总评分
      const total_score = (quality_score || 0) + (delivery_score || 0) + 
                         (price_score || 0) + (service_score || 0);
      
      // 使用模拟数据
      const newEvaluation = {
        id: mockData.supplierEvaluations.length + 1,
        supplier_id,
        evaluation_date: new Date().toISOString(),
        quality_score,
        delivery_score,
        price_score,
        service_score,
        total_score,
        evaluator_id: evaluator_id || req.user?.id || 1,
        remark,
        created_at: new Date().toISOString()
      };
      
      mockData.supplierEvaluations.push(newEvaluation);
      
      res.json(res.formatResponse(true, { id: newEvaluation.id }, '供应商评估创建成功'));
    } catch (error) {
      console.error('创建供应商评估失败:', error);
      res.status(500).json(res.formatResponse(false, null, '创建供应商评估失败'));
    }
  },

  // 更新供应商评估
  updateEvaluation: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        quality_score, delivery_score, price_score, 
        service_score, evaluator_id, remark 
      } = req.body;
      
      // 使用模拟数据
      const index = mockData.supplierEvaluations.findIndex(e => e.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '供应商评估不存在'));
      }
      
      // 计算总评分
      const total_score = (quality_score || mockData.supplierEvaluations[index].quality_score) + 
                         (delivery_score || mockData.supplierEvaluations[index].delivery_score) + 
                         (price_score || mockData.supplierEvaluations[index].price_score) + 
                         (service_score || mockData.supplierEvaluations[index].service_score);
      
      mockData.supplierEvaluations[index] = {
        ...mockData.supplierEvaluations[index],
        quality_score,
        delivery_score,
        price_score,
        service_score,
        total_score,
        evaluator_id,
        remark,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '供应商评估更新成功'));
    } catch (error) {
      console.error('更新供应商评估失败:', error);
      res.status(500).json(res.formatResponse(false, null, '更新供应商评估失败'));
    }
  },

  // 删除供应商评估
  deleteEvaluation: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.supplierEvaluations.findIndex(e => e.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '供应商评估不存在'));
      }
      
      mockData.supplierEvaluations.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '供应商评估删除成功'));
    } catch (error) {
      console.error('删除供应商评估失败:', error);
      res.status(500).json(res.formatResponse(false, null, '删除供应商评估失败'));
    }
  },

  // 获取供应商的所有评估
  getEvaluationsBySupplier: async (req, res) => {
    try {
      const { supplierId } = req.params;
      
      // 使用模拟数据
      const evaluations = mockData.supplierEvaluations.filter(
        e => e.supplier_id === parseInt(supplierId)
      );
      
      res.json(res.formatResponse(true, {
        evaluations,
        pagination: {
          page: 1,
          limit: 50,
          total: evaluations.length,
          totalPages: 1
        }
      }));
    } catch (error) {
      console.error('获取供应商评估列表失败:', error);
      res.status(500).json(res.formatResponse(false, null, '获取供应商评估列表失败'));
    }
  }
};

module.exports = supplierEvalController;