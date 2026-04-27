const { query, execute } = require('../config/database');

const projectController = {
  // 获取所有项目
  getAllProjects: async (req, res) => {
    try {
      const projects = await query(`
        SELECT p.*, c.name as customer_name, u.name as manager_name
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        ORDER BY p.created_at DESC
      `);

      res.json(res.formatResponse(true, { projects, pagination: { page: 1, limit: 50, total: projects.length, totalPages: 1 } }));
    } catch (err) {
      console.error('Get projects error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  // 获取项目详情
  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const projects = await query(`
        SELECT p.*, c.name as customer_name, u.name as manager_name
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.id = @id
      `, [{ name: 'id', type: 'INT', value: id }]);

      if (projects.length === 0) {
        return res.status(404).json({ success: false, message: '项目不存在' });
      }

      // 获取项目阶段
      const phases = await query(`
        SELECT * FROM project_phases WHERE project_id = @id ORDER BY sort_order
      `, [{ name: 'id', type: 'INT', value: id }]);

      res.json(res.formatResponse(true, { ...projects[0], phases }));
    } catch (err) {
      console.error('Get project error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  // 创建项目
  createProject: async (req, res) => {
    try {
      const { projectNo, name, customerId, contractId, projectType, status, startDate, endDate, budget, managerId, description } = req.body;

      const result = await execute('sp_InsertProject', [
        { name: 'projectNo', type: 'NVARCHAR', value: projectNo },
        { name: 'name', type: 'NVARCHAR', value: name },
        { name: 'customerId', type: 'INT', value: customerId },
        { name: 'contractId', type: 'INT', value: contractId },
        { name: 'projectType', type: 'NVARCHAR', value: projectType },
        { name: 'status', type: 'NVARCHAR', value: status || 'initiating' },
        { name: 'startDate', type: 'DATE', value: startDate },
        { name: 'endDate', type: 'DATE', value: endDate },
        { name: 'budget', type: 'DECIMAL', value: budget || 0 },
        { name: 'managerId', type: 'INT', value: managerId },
        { name: 'description', type: 'NVARCHAR', value: description },
        { name: 'createdBy', type: 'INT', value: req.user.id }
      ]);

      res.json(res.formatResponse(true, result[0], '项目创建成功'));
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  // 更新项目
  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, customerId, contractId, projectType, status, startDate, endDate, actualEndDate, budget, managerId, description } = req.body;

      await execute('sp_UpdateProject', [
        { name: 'id', type: 'INT', value: id },
        { name: 'name', type: 'NVARCHAR', value: name },
        { name: 'customerId', type: 'INT', value: customerId },
        { name: 'contractId', type: 'INT', value: contractId },
        { name: 'projectType', type: 'NVARCHAR', value: projectType },
        { name: 'status', type: 'NVARCHAR', value: status },
        { name: 'startDate', type: 'DATE', value: startDate },
        { name: 'endDate', type: 'DATE', value: endDate },
        { name: 'actualEndDate', type: 'DATE', value: actualEndDate },
        { name: 'budget', type: 'DECIMAL', value: budget || 0 },
        { name: 'managerId', type: 'INT', value: managerId },
        { name: 'description', type: 'NVARCHAR', value: description }
      ]);

      res.json(res.formatResponse(true, null, '项目更新成功'));
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  // 删除项目
  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      await execute('sp_DeleteProject', [{ name: 'id', type: 'INT', value: id }]);
      res.json(res.formatResponse(true, null, '项目删除成功'));
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  },

  // 获取项目统计
  getProjectStats: async (req, res) => {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'initiating' THEN 1 ELSE 0 END) as initiating,
          SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
        FROM projects
      `);

      res.json(res.formatResponse(true, stats[0]));
    } catch (err) {
      console.error('Get project stats error:', err);
      res.status(500).json(res.formatResponse(false, null, '服务器错误'));
    }
  }
};

module.exports = projectController;
