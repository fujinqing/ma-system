// const { query } = require('../config/database');
const mockData = require('../mockData');

const materialController = {
  getAllMaterials: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        materials: mockData.materials,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.materials.length,
          totalPages: 1
        }
      }));
    } catch (err) {
      console.error('Get materials error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  getMaterialById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const material = mockData.materials.find(m => m.id === parseInt(id));
      
      if (!material) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }
      
      res.json(res.formatResponse(true, material));
    } catch (err) {
      console.error('Get material error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  createMaterial: async (req, res) => {
    try {
      const { 
        material_code, name, category_id, specification, unit, 
        cost_price, selling_price, min_stock, max_stock, 
        current_stock, status, remark 
      } = req.body;
      
      // 使用模拟数据
      const newMaterial = {
        id: mockData.materials.length + 1,
        material_code: material_code || `MAT-${Date.now()}`,
        name,
        category_id,
        specification,
        unit,
        cost_price: cost_price || 0,
        selling_price: selling_price || 0,
        min_stock: min_stock || 0,
        max_stock: max_stock || 0,
        current_stock: current_stock || 0,
        status: status || 'active',
        remark,
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.materials.push(newMaterial);
      
      res.json(res.formatResponse(true, { id: newMaterial.id }, '物料创建成功'));
    } catch (err) {
      console.error('Create material error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  updateMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.materials.findIndex(m => m.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }
      
      mockData.materials[index] = {
        ...mockData.materials[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '物料更新成功'));
    } catch (err) {
      console.error('Update material error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  deleteMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.materials.findIndex(m => m.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '物料不存在'));
      }
      
      mockData.materials.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '物料删除成功'));
    } catch (err) {
      console.error('Delete material error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },
  
  // 获取物料分类
  getMaterialCategories: async (req, res) => {
    try {
      // 使用模拟数据
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
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  }
};

module.exports = materialController;
