/** Audit Logging Utility - Records security-related user actions */

const db = require('../models');
const logger = require('../middleware/logger');

const { AuditLog } = db;

// Log action to audit trail
exports.logAction = async (options) => {
  try {
    const {
      userId = null,
      action,
      details = {},
      ipAddress = null,
      userAgent = null
    } = options;

    const logEntry = await AuditLog.create({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    logger.debug('Action logged to audit trail', {
      context: {
        userId,
        action,
        logId: logEntry.id
      }
    });
  } catch (error) {
    // Don't throw error - audit logging should not break main operation
    logger.error('Failed to log audit action', {
      context: { action, userId: options.userId },
      error
    });
  }
};

// Get audit logs for a specific user
exports.getUserAuditLogs = async (userId, options = {}) => {
  try {
    const { limit = 100, offset = 0, action = null } = options;
    const where = { user_id: userId };
    if (action) where.action = action;

    const logs = await AuditLog.findAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    logger.debug('User audit logs retrieved', {
      context: { userId, count: logs.length }
    });

    return logs;
  } catch (error) {
    logger.error('Failed to retrieve user audit logs', {
      context: { userId },
      error
    });
    throw error;
  }
};

// Get audit logs for a specific action across all users
exports.getAuditLogsByAction = async (action, options = {}) => {
  try {
    const { limit = 100, offset = 0, days = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AuditLog.findAll({
      where: {
        action,
        created_at: { [db.Sequelize.Op.gte]: startDate }
      },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    logger.debug('Audit logs retrieved by action', {
      context: { action, count: logs.length, days }
    });

    return logs;
  } catch (error) {
    logger.error('Failed to retrieve audit logs by action', {
      context: { action },
      error
    });
    throw error;
  }
};

// Security-related action helpers

// Log user login
exports.logLogin = async (req, userId, email) => {
  return exports.logAction({
    userId,
    action: 'login',
    details: { email, method: 'email_password' },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log user logout
exports.logLogout = async (req, userId) => {
  return exports.logAction({
    userId,
    action: 'logout',
    details: {},
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log password change
exports.logPasswordChange = async (req, userId, changeType = 'changed') => {
  return exports.logAction({
    userId,
    action: `password_${changeType}`,
    details: { type: changeType },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log account deletion
exports.logAccountDeletion = async (req, userId, email) => {
  return exports.logAction({
    userId,
    action: 'account_deleted',
    details: { email },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log registration attempt
exports.logRegistration = async (req, email, success, reason = null) => {
  return exports.logAction({
    action: 'registration_attempted',
    details: { email, success, reason },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log failed login attempt
exports.logFailedLogin = async (req, email, attempt = 1) => {
  return exports.logAction({
    action: 'login_failed',
    details: { email, attempt },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log account lock due to failed attempts
exports.logAccountLocked = async (userId, email, attempts) => {
  return exports.logAction({
    userId,
    action: 'account_locked',
    details: { email, failed_attempts: attempts, reason: 'too_many_failed_logins' }
  });
};

// Log account unlock
exports.logAccountUnlock = async (req, userId) => {
  return exports.logAction({
    userId,
    action: 'account_unlocked',
    details: { unlocked_by: 'admin' },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

// Log role change
exports.logRoleChange = async (req, userId, oldRoleId, newRoleId, changedByUserId) => {
  return exports.logAction({
    userId: changedByUserId,
    action: 'role_changed',
    details: {
      target_user_id: userId,
      old_role_id: oldRoleId,
      new_role_id: newRoleId
    },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};
