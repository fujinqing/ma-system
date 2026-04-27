const sql = require('mssql');
const { getPool } = require('../config/database');

const Expense = {
  async create(expenseData) {
    const pool = await getPool();
    const { title, amount, expense_type, expense_date, description, applicant_id, applicant_name, department, status = 'draft' } = expenseData;

    const expenseNo = await this.generateExpenseNo();

    const result = await pool.request()
      .input('expense_no', sql.NVarChar, expenseNo)
      .input('title', sql.NVarChar, title)
      .input('amount', sql.Decimal(18, 2), amount)
      .input('expense_type', sql.NVarChar, expense_type)
      .input('expense_date', sql.Date, expense_date)
      .input('description', sql.NVarChar, description)
      .input('applicant_id', sql.Int, applicant_id)
      .input('applicant_name', sql.NVarChar, applicant_name)
      .input('department', sql.NVarChar, department)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO sys_expenses (
          expense_no, title, amount, expense_type, expense_date, description,
          applicant_id, applicant_name, department, status
        ) VALUES (
          @expense_no, @title, @amount, @expense_type, @expense_date, @description,
          @applicant_id, @applicant_name, @department, @status
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    return {
      id: result.recordset[0].id,
      expense_no: expenseNo
    };
  },

  async update(id, expenseData) {
    const pool = await getPool();
    const { title, amount, expense_type, expense_date, description, status } = expenseData;

    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar, title)
      .input('amount', sql.Decimal(18, 2), amount)
      .input('expense_type', sql.NVarChar, expense_type)
      .input('expense_date', sql.Date, expense_date)
      .input('description', sql.NVarChar, description)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE sys_expenses SET
          title = @title,
          amount = @amount,
          expense_type = @expense_type,
          expense_date = @expense_date,
          description = @description,
          status = @status,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    return { id };
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM sys_expenses WHERE id = @id');

    return result.recordset[0] || null;
  },

  async getList(filters = {}, pagination = { page: 1, limit: 20 }) {
    const pool = await getPool();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.keyword) {
      whereClause += ' AND (e.title LIKE @keyword OR e.expense_no LIKE @keyword)';
      params.push({ name: 'keyword', value: `%${filters.keyword}%` });
    }

    if (filters.status) {
      whereClause += ' AND e.status = @status';
      params.push({ name: 'status', value: filters.status });
    }

    if (filters.startDate) {
      whereClause += ' AND e.created_at >= @startDate';
      params.push({ name: 'startDate', value: filters.startDate });
    }

    if (filters.endDate) {
      whereClause += ' AND e.created_at <= @endDate';
      params.push({ name: 'endDate', value: filters.endDate });
    }

    if (filters.applicant_id) {
      whereClause += ' AND e.applicant_id = @applicant_id';
      params.push({ name: 'applicant_id', value: filters.applicant_id });
    }

    const countRequest = pool.request();
    params.forEach(p => countRequest.input(p.name, sql.NVarChar, p.value));

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM sys_expenses e ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    const dataRequest = pool.request();
    params.forEach(p => dataRequest.input(p.name, sql.NVarChar, p.value));
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('limit', sql.Int, limit);

    const result = await dataRequest.query(`
      SELECT * FROM sys_expenses e
      ${whereClause}
      ORDER BY e.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      total
    };
  },

  async updateStatus(id, status, reviewerId = null, reviewerName = null, comment = null) {
    const pool = await getPool();

    let query = 'UPDATE sys_expenses SET status = @status, updated_at = GETDATE()';
    if (status === 'approved' || status === 'rejected') {
      query += ', reviewed_at = GETDATE()';
      if (reviewerId) query += ', reviewer_id = @reviewer_id';
      if (reviewerName) query += ', reviewer_name = @reviewer_name';
      if (comment) query += ', review_comment = @reviewer_comment';
    }
    if (status === 'paid') {
      query += ', paid_at = GETDATE()';
    }
    query += ' WHERE id = @id';

    const request = pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status);

    if (reviewerId) request.input('reviewer_id', sql.Int, reviewerId);
    if (reviewerName) request.input('reviewer_name', sql.NVarChar, reviewerName);
    if (comment) request.input('reviewer_comment', sql.NVarChar, comment);

    await request.query(query);

    return { id, status };
  },

  async generateExpenseNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP${year}${month}${day}${random}`;
  },

  async getStatistics(applicantId = null) {
    const pool = await getPool();
    let whereClause = '';
    const params = [];

    if (applicantId) {
      whereClause = 'WHERE applicant_id = @applicant_id';
      params.push({ name: 'applicant_id', value: applicantId });
    }

    const result = await pool.request()
      .query(`
        SELECT
          COUNT(*) as total_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'approved' OR status = 'paid' THEN amount ELSE 0 END) as approved_amount,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
        FROM sys_expenses
        ${whereClause}
      `);

    return result.recordset[0];
  }
};

module.exports = Expense;
