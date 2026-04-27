const { query } = require('../config/database');

const AuditLog = {
  async log(action, userId, details, req) {
    try {
      // 如果 userId 为 undefined 或 null，则不记录审计日志
      if (!userId) {
        console.log('审计日志跳过：userId 为空');
        return;
      }
      
      const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';
      
      await query(`
        INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
        VALUES (@userId, @action, @details, @ip, @userAgent, GETDATE())
      `, [
        { name: 'userId', type: 'INT', value: userId },
        { name: 'action', type: 'NVARCHAR', value: action },
        { name: 'details', type: 'NVARCHAR', value: JSON.stringify(details) },
        { name: 'ip', type: 'NVARCHAR', value: ip },
        { name: 'userAgent', type: 'NVARCHAR', value: userAgent }
      ]);
    } catch (err) {
      console.error('Audit log failed:', err.message);
    }
  },

  async getLogs(filters = {}, pagination = { page: 1, limit: 50 }) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.userId) {
      paramIndex++;
      whereClause += ` AND user_id = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: 'INT', value: filters.userId });
    }

    if (filters.action) {
      paramIndex++;
      whereClause += ` AND action = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: 'NVARCHAR', value: filters.action });
    }

    if (filters.startDate) {
      paramIndex++;
      whereClause += ` AND created_at >= @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: 'DATETIME', value: filters.startDate });
    }

    if (filters.endDate) {
      paramIndex++;
      whereClause += ` AND created_at <= @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: 'DATETIME', value: filters.endDate });
    }

    const offset = (pagination.page - 1) * pagination.limit;
    paramIndex++;
    const countParams = [...params];
    countParams.push({ name: `p${paramIndex}`, type: 'INT', value: pagination.limit });
    paramIndex++;
    countParams.push({ name: `p${paramIndex}`, type: 'INT', value: offset });

    const [countResult, logs] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params),
      query(`
        SELECT * FROM audit_logs 
        ${whereClause} 
        ORDER BY created_at DESC 
        OFFSET @p${paramIndex - 1} ROWS FETCH NEXT @p${paramIndex} ROWS ONLY
      `, countParams)
    ]);

    return {
      logs,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / pagination.limit)
      }
    };
  }
};

module.exports = AuditLog;
