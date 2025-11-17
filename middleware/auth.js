/** Authentication Middleware - JWT verification & authorization */

const jwt = require('jsonwebtoken');
const logger = require('./logger');
const responseUtil = require('../utils/responseUtil');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Verify JWT Token
exports.verifyToken = (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    // ========== EXTRACT TOKEN ==========
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Token missing in request', {
        correlationId,
        context: { ip: req.ip, method: req.method, path: req.path }
      });
      return res.status(401).json(responseUtil.unauthorized(req,
        'Token là bắt buộc. Vui lòng cung cấp token trong Authorization header.'
      ));
    }

    // ========== PARSE BEARER TOKEN ==========
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid token format', {
        correlationId,
        context: { authHeader: authHeader.substring(0, 20) + '...' }
      });
      return res.status(401).json(responseUtil.unauthorized(req,
        'Token format không hợp lệ. Sử dụng format: Bearer <token>'
      ));
    }

    const token = parts[1];

    // ========== VERIFY TOKEN ==========
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;

    logger.debug('Token verified successfully', {
      correlationId,
      context: { userId: decoded.user_id, email: decoded.email }
    });

    next();
  } catch (error) {
    // ========== ERROR HANDLING ==========
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', {
        correlationId,
        context: { expiredAt: error.expiredAt }
      });
      return res.status(401).json(responseUtil.unauthorized(req,
        'Token đã hết hạn. Vui lòng đăng nhập lại.'
      ));
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', {
        correlationId,
        context: { error: error.message }
      });
      return res.status(401).json(responseUtil.unauthorized(req,
        'Token không hợp lệ.'
      ));
    }

    logger.error('Token verification failed', {
      correlationId,
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi xác minh token.'
    ));
  }
};

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const correlationId = req.correlationId;

    try {
      if (!req.user) {
        return res.status(401).json(responseUtil.unauthorized(req,
          'Chưa xác thực. Vui lòng đăng nhập.'
        ));
      }

      const userRole = req.user.role_id || req.user.user_role;
      
      if (roles.length && !roles.includes(userRole)) {
        logger.warn('Authorization failed', {
          correlationId,
          context: { userId: req.user.user_id, userRole, requiredRoles: roles }
        });
        return res.status(403).json(responseUtil.forbidden(req,
          `Quyền truy cập từ chối. Chỉ role ${roles.join(', ')} mới có quyền.`
        ));
      }

      next();
    } catch (error) {
      logger.error('Authorization check failed', { correlationId, error });
      return res.status(500).json(responseUtil.serverError(req,
        'Lỗi server khi kiểm tra quyền.'
      ));
    }
  };
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  const correlationId = req.correlationId;

  if (!req.user) {
    return res.status(401).json(responseUtil.unauthorized(req, 'Chưa xác thực.'));
  }

  const userRole = req.user.role_id || req.user.user_role;
  
  if (userRole !== 1 && userRole !== 'admin') {
    logger.warn('Admin access denied', {
      correlationId,
      context: { userId: req.user.user_id, userRole }
    });
    return res.status(403).json(responseUtil.forbidden(req,
      'Chỉ admin mới có quyền truy cập.'
    ));
  }

  next();
};

// Check if user is admin or manager
exports.isAdminOrManager = (req, res, next) => {
  const correlationId = req.correlationId;

  if (!req.user) {
    return res.status(401).json(responseUtil.unauthorized(req, 'Chưa xác thực.'));
  }

  const userRole = req.user.role_id || req.user.user_role;
  
  if (![1, 2, 'admin', 'manager'].includes(userRole)) {
    logger.warn('Admin/Manager access denied', {
      correlationId,
      context: { userId: req.user.user_id, userRole }
    });
    return res.status(403).json(responseUtil.forbidden(req,
      'Chỉ admin hoặc manager mới có quyền truy cập.'
    ));
  }

  next();
};

// Check if user is staff or above
exports.isStaffOrAbove = (req, res, next) => {
  const correlationId = req.correlationId;

  if (!req.user) {
    return res.status(401).json(responseUtil.unauthorized(req, 'Chưa xác thực.'));
  }

  const userRole = req.user.role_id || req.user.user_role;
  
  if (![1, 2, 3, 'admin', 'manager', 'staff'].includes(userRole)) {
    logger.warn('Staff access denied', {
      correlationId,
      context: { userId: req.user.user_id, userRole }
    });
    return res.status(403).json(responseUtil.forbidden(req,
      'Chỉ admin, manager hoặc staff mới có quyền truy cập.'
    ));
  }

  next();
};

// Optional authentication
exports.optionalAuth = (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    logger.debug('Optional auth skipped', { correlationId });
    next();
  }
};

// Check user permission
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    const correlationId = req.correlationId;

    try {
      if (!req.user) {
        return res.status(401).json(responseUtil.unauthorized(req, 'Chưa xác thực.'));
      }

      const permissions = req.user.permissions || {};
      
      if (!permissions[permission]) {
        logger.warn('Permission denied', {
          correlationId,
          context: { userId: req.user.user_id, requiredPermission: permission }
        });
        return res.status(403).json(responseUtil.forbidden(req,
          `Bạn không có quyền ${permission}.`
        ));
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', { correlationId, error });
      return res.status(500).json(responseUtil.serverError(req,
        'Lỗi server khi kiểm tra quyền.'
      ));
    }
  };
};

// Check if user role is active
exports.isRoleActive = (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    if (!req.user) {
      return res.status(401).json(responseUtil.unauthorized(req, 'Chưa xác thực.'));
    }

    if (!req.user.role_name || !req.user.is_active) {
      logger.warn('Role inactive - access denied', {
        correlationId,
        context: { userId: req.user.user_id }
      });
      return res.status(403).json(responseUtil.forbidden(req,
        'Quyền của bạn không hoạt động hoặc tài khoản đã bị vô hiệu hóa.'
      ));
    }

    next();
  } catch (error) {
    logger.error('Role active check failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi kiểm tra role.'
    ));
  }
};

// Optional verify token
exports.verifyTokenOptional = (req, res, next) => {
  const correlationId = req.correlationId;

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      logger.debug('Optional token verified', {
        correlationId,
        context: { userId: decoded.user_id }
      });
    } catch (jwtError) {
      logger.debug('Optional token verification failed', { correlationId });
    }

    next();
  } catch (error) {
    logger.error('Optional token verification error', { correlationId, error });
    next();
  }
};
