const sql = require('mssql');
const config = require('./index');

let pool = null;

const getPool = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(config.database);
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection failed:', err.message);
      throw err;
    }
  }
  return pool;
};

const query = async (sqlText, params = []) => {
  const pool = await getPool();
  const request = pool.request();
  
  params.forEach(param => {
    if (param.value !== undefined && param.value !== null) {
      request.input(param.name, param.type, param.value);
    }
  });
  
  const result = await request.query(sqlText);
  return result.recordset;
};

const execute = async (procedureName, params = []) => {
  const pool = await getPool();
  const request = pool.request();
  
  params.forEach(param => {
    if (param.value !== undefined && param.value !== null) {
      request.input(param.name, param.type, param.value);
    }
  });
  
  const result = await request.execute(procedureName);
  return result.recordset;
};

const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

module.exports = {
  getPool,
  query,
  execute,
  closePool,
  sql
};
