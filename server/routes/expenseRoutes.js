const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/expenses', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, status, startDate, endDate } = req.query;

    const result = await expenseController.getList(
      {
        keyword,
        status,
        startDate,
        endDate,
        applicant_id: req.query.my ? req.user.id : null
      },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json(res.formatResponse(true, result.data, null, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }));
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取报销列表失败'));
  }
});

router.get('/expenses/statistics', async (req, res) => {
  try {
    const result = await expenseController.getStatistics(req.query.my ? req.user.id : null);
    res.json(res.formatResponse(true, result));
  } catch (error) {
    console.error('Get expense statistics error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取统计数据失败'));
  }
});

router.get('/expenses/:id', async (req, res) => {
  try {
    const expense = await expenseController.getById(parseInt(req.params.id));

    if (!expense) {
      return res.status(404).json(res.formatResponse(false, null, '报销单不存在'));
    }

    res.json(res.formatResponse(true, expense));
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json(res.formatResponse(false, null, '获取报销单详情失败'));
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { title, amount, expense_type, expense_date, description } = req.body;

    if (!title || !amount || !expense_type || !expense_date) {
      return res.status(400).json(res.formatResponse(false, null, '请填写完整的报销信息'));
    }

    const result = await expenseController.create({
      title,
      amount,
      expense_type,
      expense_date,
      description,
      applicant_id: req.user.id,
      applicant_name: req.user.name || req.user.username,
      department: req.user.department || '',
      status: req.body.status || 'draft'
    });

    res.json(res.formatResponse(true, result, '报销单创建成功'));
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json(res.formatResponse(false, null, '创建报销单失败'));
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = await expenseController.getById(id);

    if (!expense) {
      return res.status(404).json(res.formatResponse(false, null, '报销单不存在'));
    }

    if (expense.applicant_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(res.formatResponse(false, null, '无权修改此报销单'));
    }

    const { title, amount, expense_type, expense_date, description, status } = req.body;

    await expenseController.update(id, {
      title,
      amount,
      expense_type,
      expense_date,
      description,
      status
    });

    res.json(res.formatResponse(true, null, '报销单更新成功'));
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json(res.formatResponse(false, null, '更新报销单失败'));
  }
});

router.post('/expenses/:id/approve', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = await expenseController.getById(id);

    if (!expense) {
      return res.status(404).json(res.formatResponse(false, null, '报销单不存在'));
    }

    if (expense.status !== 'pending') {
      return res.status(400).json(res.formatResponse(false, null, '只能审批待审批状态的报销单'));
    }

    await expenseController.updateStatus(
      id,
      'approved',
      req.user.id,
      req.user.name || req.user.username,
      req.body.comment
    );

    res.json(res.formatResponse(true, null, '报销单已批准'));
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json(res.formatResponse(false, null, '批准报销单失败'));
  }
});

router.post('/expenses/:id/reject', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = await expenseController.getById(id);

    if (!expense) {
      return res.status(404).json(res.formatResponse(false, null, '报销单不存在'));
    }

    if (expense.status !== 'pending') {
      return res.status(400).json(res.formatResponse(false, null, '只能拒绝待审批状态的报销单'));
    }

    await expenseController.updateStatus(
      id,
      'rejected',
      req.user.id,
      req.user.name || req.user.username,
      req.body.comment
    );

    res.json(res.formatResponse(true, null, '报销单已拒绝'));
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json(res.formatResponse(false, null, '拒绝报销单失败'));
  }
});

router.post('/expenses/:id/paid', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = await expenseController.getById(id);

    if (!expense) {
      return res.status(404).json(res.formatResponse(false, null, '报销单不存在'));
    }

    if (expense.status !== 'approved') {
      return res.status(400).json(res.formatResponse(false, null, '只能打款已批准的报销单'));
    }

    await expenseController.updateStatus(id, 'paid');

    res.json(res.formatResponse(true, null, '报销单已标记为已打款'));
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json(res.formatResponse(false, null, '操作失败'));
  }
});

module.exports = router;
