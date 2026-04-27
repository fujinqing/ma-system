const sql = require('mssql');
const { getPool } = require('../config/database');

const OperationLog = {
  async log(info) {
    try {
      const {
        userId,
        username,
        userName,
        action,
        module,
        description,
        details,
        method,
        path,
        ipAddress,
        userAgent,
        statusCode,
        duration
      } = info;

      const pool = await getPool();
      await pool.request()
        .input('user_id', sql.Int, userId || null)
        .input('username', sql.NVarChar, username || null)
        .input('user_name', sql.NVarChar, userName || null)
        .input('action', sql.NVarChar, action || '')
        .input('module', sql.NVarChar, module || null)
        .input('description', sql.NVarChar, description || null)
        .input('details', sql.NVarChar, details ? JSON.stringify(details) : null)
        .input('method', sql.NVarChar, method || null)
        .input('path', sql.NVarChar, path || null)
        .input('ip_address', sql.NVarChar, ipAddress || null)
        .input('user_agent', sql.NVarChar, userAgent || null)
        .input('status_code', sql.Int, statusCode || null)
        .input('duration', sql.Int, duration || null)
        .query(`
          INSERT INTO sys_operation_logs (
            user_id, username, user_name, action, module, description, details,
            method, path, ip_address, user_agent, status_code, duration
          ) VALUES (
            @user_id, @username, @user_name, @action, @module, @description, @details,
            @method, @path, @ip_address, @user_agent, @status_code, @duration
          )
        `);
    } catch (err) {
      console.error('Operation log failed:', err.message);
    }
  },

  async getLogs(filters = {}, pagination = { page: 1, limit: 50 }) {
    const pool = await getPool();
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.userId) {
      paramIndex++;
      whereClause += ` AND user_id = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.Int, value: parseInt(filters.userId) });
    }

    if (filters.username) {
      paramIndex++;
      whereClause += ` AND (username LIKE @p${paramIndex} OR user_name LIKE @p${paramIndex})`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: `%${filters.username}%` });
    }

    if (filters.action) {
      paramIndex++;
      whereClause += ` AND action = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: filters.action });
    }

    if (filters.module) {
      paramIndex++;
      whereClause += ` AND module = @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: filters.module });
    }

    if (filters.startDate) {
      paramIndex++;
      whereClause += ` AND created_at >= @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.DateTime, value: filters.startDate });
    }

    if (filters.endDate) {
      paramIndex++;
      whereClause += ` AND created_at <= @p${paramIndex}`;
      params.push({ name: `p${paramIndex}`, type: sql.DateTime, value: filters.endDate });
    }

    if (filters.keyword) {
      paramIndex++;
      whereClause += ` AND (description LIKE @p${paramIndex} OR details LIKE @p${paramIndex})`;
      params.push({ name: `p${paramIndex}`, type: sql.NVarChar, value: `%${filters.keyword}%` });
    }

    const offset = (parseInt(pagination.page) - 1) * parseInt(pagination.limit);
    paramIndex++;
    const countParams = [...params];
    countParams.push({ name: `p${paramIndex}`, type: sql.Int, value: parseInt(pagination.limit) });
    paramIndex++;
    countParams.push({ name: `p${paramIndex}`, type: sql.Int, value: offset });

    try {
      const countResult = await pool.request()
        .input('params', sql.NVarChar, params.map((p, i) => `p${i+1}`).join(','))
        .query(`SELECT COUNT(*) as total FROM sys_operation_logs ${whereClause}`, params);

      const total = countResult.recordset[0].total;

      const logsResult = await pool.request()
        .input('limit', sql.Int, parseInt(pagination.limit))
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM sys_operation_logs
          ${whereClause}
          ORDER BY created_at DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, params);

      return {
        logs: logsResult.recordset,
        pagination: {
          page: parseInt(pagination.page),
          limit: parseInt(pagination.limit),
          total,
          totalPages: Math.ceil(total / parseInt(pagination.limit))
        }
      };
    } catch (err) {
      console.error('Get operation logs error:', err);
      throw err;
    }
  },

  async getStatistics() {
    const pool = await getPool();
    try {
      const result = await pool.request().query(`
        SELECT
          COUNT(*) as totalLogs,
          COUNT(DISTINCT user_id) as activeUsers,
          COUNT(DISTINCT action) as actionTypes,
          COUNT(DISTINCT module) as modules
        FROM sys_operation_logs
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
      `);

      const moduleStats = await pool.request().query(`
        SELECT TOP 10
          module,
          COUNT(*) as count
        FROM sys_operation_logs
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
        GROUP BY module
        ORDER BY count DESC
      `);

      const actionStats = await pool.request().query(`
        SELECT TOP 10
          action,
          COUNT(*) as count
        FROM sys_operation_logs
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
        GROUP BY action
        ORDER BY count DESC
      `);

      return {
        summary: result.recordset[0],
        moduleStats: moduleStats.recordset,
        actionStats: actionStats.recordset
      };
    } catch (err) {
      console.error('Get operation log statistics error:', err);
      throw err;
    }
  },

  async cleanup() {
    const pool = await getPool();
    try {
      const result = await pool.request()
        .query(`EXEC sp_Cleanup_Operation_Logs`);
      return { success: true, message: `已清理操作日志` };
    } catch (err) {
      console.error('Cleanup operation logs error:', err);
      throw err;
    }
  },

  async deleteOldLogs(months = 3) {
    const pool = await getPool();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    try {
      const result = await pool.request()
        .input('cutoffDate', sql.DateTime, cutoffDate)
        .query(`
          DELETE FROM sys_operation_logs
          WHERE created_at < @cutoffDate
        `);

      return {
        success: true,
        deletedCount: result.rowsAffected[0],
        cutoffDate: cutoffDate.toISOString()
      };
    } catch (err) {
      console.error('Delete old logs error:', err);
      throw err;
    }
  }
};

module.exports = OperationLog;
