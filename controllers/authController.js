/** Authentication Controller - Register, login, token management */

const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { authService } = require('../services');
const jwt = require('jsonwebtoken');
const db = require('../models');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const { User, Role } = db;

// Register user
exports.register = async (req, res) => {
  const correlationId = req.correlationId;

  try {
    // Call authService to handle registration logic
    const result = await authService.register(req.body, req.user);

    // Determine message based on mode
    const mode = req.user ? 'Staff account created' : 'Customer registered';
    
    logger.info(`${mode} successfully`, {
      correlationId,
      context: {
        userId: result.user.user_id,
        email: result.user.email,
        role_id: result.user.role_id
      }
    });

    return res.status(201).json(
      responseUtil.success(req, `${mode} successfully`, result, 201)
    );
  } catch (error) {
    logger.error('Registration failed', {
      correlationId,
      context: { email: req.body.email, user_name: req.body.user_name },
      error
    });

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return res.status(400).json(
        responseUtil.validationError(req, error.message)
      );
    }
    if (error.message.includes('Invalid email')) {
      return res.status(400).json(
        responseUtil.validationError(req, error.message)
      );
    }
    if (error.message.includes('Invalid role')) {
      return res.status(400).json(
        responseUtil.validationError(req, error.message)
      );
    }
    if (error.message.includes('Password does not meet')) {
      return res.status(400).json(
        responseUtil.validationError(req, error.message)
      );
    }
    if (error.message.includes('Email is already registered')) {
      return res.status(409).json(
        responseUtil.conflict(req, error.message)
      );
    }
    if (error.message.includes('Only admin/manager')) {
      return res.status(403).json(
        responseUtil.forbidden(req, error.message)
      );
    }

    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to register user')
    );
  }
};

/**
 * User login with credentials
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const correlationId = req.correlationId;

  try {
    const result = await authService.login(email, password);

    logger.info('User logged in successfully', {
      correlationId,
      context: { userId: result.user.user_id, email }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Login successful', result)
    );
  } catch (error) {
    logger.error('Login failed', {
      correlationId,
      context: { email },
      error
    });

    if (error.message.includes('locked')) {
      return res.status(401).json(
        responseUtil.unauthorized(req, error.message)
      );
    }
    if (error.message.includes('incorrect')) {
      return res.status(401).json(
        responseUtil.unauthorized(req, error.message)
      );
    }
    
    return res.status(500).json(
      responseUtil.serverError(req, 'Login failed')
    );
  }
};

// Verify JWT token validity
exports.verifyTokenEndpoint = async (req, res) => {
  const token = req.body.token || req.headers.authorization?.split(' ')[1];
  const correlationId = req.correlationId;

  if (!token) {
    logger.debug('Token verification - token missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Token is required', { token: 'Required' })
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('Token verified successfully', {
      correlationId,
      context: { userId: decoded.user_id, email: decoded.email }
    });
    return res.status(200).json(
      responseUtil.success(req, 'Token is valid', {
        user_id: decoded.user_id,
        email: decoded.email,
        user_name: decoded.user_name,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
        permissions: decoded.permissions
      })
    );
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Token verification - token expired', { correlationId });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'Token has expired')
      );
    }
    logger.debug('Token verification - invalid token', { correlationId });
    return res.status(401).json(
      responseUtil.unauthorized(req, 'Token is invalid')
    );
  }
};

// Refresh JWT token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const correlationId = req.correlationId;

  if (!refreshToken) {
    logger.debug('Token refresh - token missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Refresh token is required', { refreshToken: 'Required' })
    );
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Get fresh user data with role
    const user = await User.findOne({
      where: { user_id: decoded.user_id },
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name', 'permissions', 'is_active']
      }]
    });

    if (!user || user.lock_up) {
      logger.warn('Token refresh - user not found or locked', {
        correlationId,
        context: { userId: decoded.user_id }
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'User not found or account is locked')
      );
    }

    // Check if role is still active
    if (user.role && !user.role.is_active) {
      logger.warn('Token refresh - role is inactive', {
        correlationId,
        context: { userId: user.user_id, roleId: user.role_id }
      });
      return res.status(403).json(
        responseUtil.forbidden(req, 'Your role is no longer active')
      );
    }

    const newToken = generateToken(user, user.role);
    logger.info('Token refreshed successfully', {
      correlationId,
      context: { userId: user.user_id }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Token refreshed successfully', {
        token: newToken,
        expiresIn: JWT_EXPIRES_IN
      })
    );
  } catch (error) {
    logger.debug('Token refresh failed - invalid token', {
      correlationId,
      context: { error: error.message }
    });
    return res.status(401).json(
      responseUtil.unauthorized(req, 'Refresh token is invalid or expired')
    );
  }
};

// Get current authenticated user profile
exports.getCurrentUser = async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;

  if (!userId) {
    logger.warn('Get current user - no user ID in token', { correlationId });
    return res.status(401).json(
      responseUtil.unauthorized(req, 'Unable to identify user')
    );
  }

  try {
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name', 'permissions', 'is_active']
      }]
    });

    if (!user) {
      logger.warn('Get current user - user not found', {
        correlationId,
        context: { userId }
      });
      return res.status(404).json(
        responseUtil.notFound(req, 'User')
      );
    }

    logger.debug('Current user profile retrieved', {
      correlationId,
      context: { userId }
    });

    return res.status(200).json(
      responseUtil.success(req, 'User profile retrieved', user)
    );
  } catch (error) {
    logger.error('Failed to get current user', {
      correlationId,
      context: { userId },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to retrieve user profile')
    );
  }
};

// Check if user has specific permission
exports.checkPermission = async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;
  const { permission } = req.body;

  if (!permission) {
    logger.debug('Check permission - permission name missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Permission name is required', { permission: 'Required' })
    );
  }

  if (!userId) {
    logger.warn('Check permission - no user ID', { correlationId });
    return res.status(401).json(
      responseUtil.unauthorized(req)
    );
  }

  try {
    const user = await User.findOne({
      where: { user_id: userId },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_name', 'permissions', 'is_active']
      }]
    });

    if (!user || !user.role) {
      logger.warn('Check permission - user or role not found', {
        correlationId,
        context: { userId }
      });
      return res.status(404).json(
        responseUtil.notFound(req, 'User or Role')
      );
    }

    const permissions = user.role.permissions || {};
    const hasPermission = permissions[permission] === true;

    logger.debug('Permission checked', {
      correlationId,
      context: { userId, permission, hasPermission, roleName: user.role.role_name }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Permission checked', {
        user_id: userId,
        permission,
        has_permission: hasPermission,
        role_name: user.role.role_name
      })
    );
  } catch (error) {
    logger.error('Permission check failed', {
      correlationId,
      context: { userId, permission },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to check permission')
    );
  }
};

// User logout
exports.logout = async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;

  logger.info('User logged out', {
    correlationId,
    context: { userId }
  });

  return res.status(200).json(
    responseUtil.success(req, 'Logout successful')
  );
};
