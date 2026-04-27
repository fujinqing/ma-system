// const { query, execute } = require('../config/database');
const mockData = require('../mockData');
const AuditLog = require('../middleware/auditLog');

const supplierController = {
  getAllSuppliers: async (req, res) => {
    try {
      // 使用模拟数据
      res.json(res.formatResponse(true, {
        suppliers: mockData.suppliers,
        pagination: {
          page: 1,
          limit: 50,
          total: mockData.suppliers.length,
          totalPages: 1
        }
      }));
    } catch (err) {
      console.error('Get suppliers error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  getSupplierById: async (req, res) => {
    try {
      const { id } = req.params;
      // 使用模拟数据
      const supplier = mockData.suppliers.find(s => s.id === parseInt(id));
      
      if (!supplier) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }
      
      res.json(res.formatResponse(true, supplier));
    } catch (err) {
      console.error('Get supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  createSupplier: async (req, res) => {
    try {
      const { 
        supplier_code, name, contact_person, contact_phone, contact_email, 
        address, category, website, bank_info, tax_number, status, 
        qualification_status, rating, remark 
      } = req.body;
      
      // 使用模拟数据
      const newSupplier = {
        id: mockData.suppliers.length + 1,
        supplier_code: supplier_code || `SUP-${Date.now()}`,
        name,
        contact_person,
        contact_phone,
        contact_email,
        address,
        category,
        website,
        bank_info,
        tax_number,
        status: status || 'active',
        qualification_status: qualification_status || 'pending',
        rating: rating || 0,
        remark,
        created_by: req.user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.suppliers.push(newSupplier);
      
      res.json(res.formatResponse(true, { id: newSupplier.id }, '供应商创建成功'));
    } catch (err) {
      console.error('Create supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  updateSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 使用模拟数据
      const index = mockData.suppliers.findIndex(s => s.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }
      
      mockData.suppliers[index] = {
        ...mockData.suppliers[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      res.json(res.formatResponse(true, null, '供应商更新成功'));
    } catch (err) {
      console.error('Update supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  deleteSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.suppliers.findIndex(s => s.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }
      
      mockData.suppliers.splice(index, 1);
      
      res.json(res.formatResponse(true, null, '供应商删除成功'));
    } catch (err) {
      console.error('Delete supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },
  
  // 供应商资格认证
  qualifySupplier: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 使用模拟数据
      const index = mockData.suppliers.findIndex(s => s.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json(res.formatResponse(false, null, '供应商不存在'));
      }
      
      mockData.suppliers[index].qualification_status = 'qualified';
      mockData.suppliers[index].updated_at = new Date().toISOString();
      
      res.json(res.formatResponse(true, null, '供应商资格认证成功'));
    } catch (err) {
      console.error('Qualify supplier error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  }
};

module.exports = supplierController;
