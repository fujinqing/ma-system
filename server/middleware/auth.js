const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(res.formatResponse(false, null, '未提供认证令牌'));
  }

  // 临时允许模拟token通过验证
  if (token.startsWith('mock-token-')) {
    // 从模拟token中提取用户信息
    const mockUser = {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin'
    };
    req.user = mockUser;
    return next();
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json(res.formatResponse(false, null, '令牌无效或已过期'));
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json(res.formatResponse(false, null, '需要管理员权限'));
  }
};

const isSupervisor = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
    next();
  } else {
    res.status(403).json(res.formatResponse(false, null, '需要主管或更高权限'));
  }
};

const isSalesManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'supervisor' || req.user.role === 'sales')) {
    next();
  } else {
    res.status(403).json(res.formatResponse(false, null, '需要销售或更高权限'));
  }
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      departmentId: user.department_id
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

module.exports = {
  authenticateToken,
  isAdmin,
  isSupervisor,
  isSalesManager,
  generateToken
};
