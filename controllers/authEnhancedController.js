/**
 * Enhanced Auth Controller - Additional Password Management Functions
 * 
 * Handles: Forgot password, Reset password, Change password, Account deletion, Account unlock
 * These functions are called from authRoutes.js and provide security-enhanced password management flows
 */

const db = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const validationUtil = require('../utils/validationUtil');
const tokenUtil = require('../utils/tokenUtil');
const auditUtil = require('../utils/auditUtil');

const { User, Role } = db;

// ==================== HELPER FUNCTIONS ====================

// Send email with reset token
const sendTokenEmail = async (email, token, type = 'reset') => {
  try {
    const templateMap = {
      reset: {
        subject: 'Password Reset Request',
        link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`,
        message: 'Click the link below to reset your password'
      },
      verification: {
        subject: 'Verify Your Email',
        link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`,
        message: 'Click the link below to verify your email'
      }
    };

    const template = templateMap[type];

    logger.info(`${type} email would be sent`, {
      context: {
        email,
        subject: template.subject,
        token: token.substring(0, 10) + '...'
      }
    });

    // TODO: Integrate with email service
    // await emailService.send({
    //   to: email,
    //   subject: template.subject,
    //   html: `<p>${template.message}</p><a href="${template.link}">Reset Password</a>`
    // });

    return true;
  } catch (error) {
    logger.error('Failed to send token email', { context: { email }, error });
    return false;
  }
};

// ==================== CONTROLLER FUNCTIONS ====================

// Request password reset
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const correlationId = req.correlationId;

  // ===== VALIDATION =====
  if (!email) {
    logger.debug('Forgot password - email missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Email is required', { email: 'Required' })
    );
  }

  if (!validationUtil.isValidEmail(email)) {
    logger.debug('Forgot password - invalid email format', { correlationId, context: { email } });
    return res.status(400).json(
      responseUtil.validationError(req, 'Invalid email format', { email: 'Invalid format' })
    );
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Security: Always return success message (don't reveal if email exists)
    const successResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent shortly.',
      status_code: 200
    };

    if (!user) {
      logger.info('Forgot password attempt with non-existent email', {
        correlationId,
        context: { email }
      });
      // Return generic success to prevent email enumeration
      return res.status(200).json(successResponse);
    }

    // Create reset token
    const { token } = await tokenUtil.createPasswordResetToken(user.user_id);

    // Send email with reset link
    const emailSent = await sendTokenEmail(email, token, 'reset');

    if (!emailSent) {
      logger.warn('Failed to send password reset email', {
        correlationId,
        context: { userId: user.user_id, email }
      });
      // Still return success to user (email might fail silently in production)
    }

    // Log action
    await auditUtil.logAction({
      action: 'password_reset_requested',
      details: { email, emailSent },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    return res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Forgot password failed', {
      correlationId,
      context: { email },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to process password reset request')
    );
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  const { token, new_password, confirm_password } = req.body;
  const correlationId = req.correlationId;

  // ===== VALIDATION =====
  const validation = validationUtil.validateRequiredFields(req.body, [
    'token', 'new_password', 'confirm_password'
  ]);
  if (!validation.isValid) {
    logger.debug('Reset password - missing fields', {
      correlationId,
      context: { missingFields: validation.missingFields }
    });
    return res.status(400).json(
      responseUtil.validationError(req, 'All fields are required', { missingFields: validation.missingFields })
    );
  }

  // Check passwords match
  if (new_password !== confirm_password) {
    logger.debug('Reset password - passwords do not match', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Passwords do not match', { confirm_password: 'Must match new_password' })
    );
  }

  // Validate password strength
  const pwdValidation = validationUtil.validatePasswordStrength(new_password);
  if (!pwdValidation.isValid) {
    logger.debug('Reset password - weak password', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Password does not meet strength requirements', {
        new_password: pwdValidation.errors[0]
      })
    );
  }

  try {
    // Verify token
    const tokenVerification = await tokenUtil.verifyPasswordResetToken(token);
    if (!tokenVerification.is_valid) {
      logger.warn('Reset password - invalid token', {
        correlationId,
        context: { reason: tokenVerification.reason }
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, `Password reset failed: ${tokenVerification.reason}`)
      );
    }

    const userId = tokenVerification.user_id;

    // Get user
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      logger.warn('Reset password - user not found', { correlationId, context: { userId } });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'Password reset failed: User not found')
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await User.update(
      {
        password: hashedPassword,
        login_attempt: 0, // Reset login attempts
        lock_up: false // Unlock if locked
      },
      { where: { user_id: userId } }
    );

    // Mark token as used
    await tokenUtil.markResetTokenAsUsed(tokenVerification.token_id);

    // Log action
    await auditUtil.logPasswordChange(req, userId, 'reset');

    logger.info('Password reset successfully', {
      correlationId,
      context: { userId, email: user.email }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Password reset successfully. Please login with your new password.', {
        email: user.email
      })
    );
  } catch (error) {
    logger.error('Password reset failed', {
      correlationId,
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to reset password')
    );
  }
};

// Change password (authenticated user)
exports.changePassword = async (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;

  if (!userId) {
    logger.warn('Change password - no user ID', { correlationId });
    return res.status(401).json(
      responseUtil.unauthorized(req, 'User not authenticated')
    );
  }

  // ===== VALIDATION =====
  const validation = validationUtil.validateRequiredFields(req.body, [
    'old_password', 'new_password', 'confirm_password'
  ]);
  if (!validation.isValid) {
    logger.debug('Change password - missing fields', {
      correlationId,
      context: { userId, missingFields: validation.missingFields }
    });
    return res.status(400).json(
      responseUtil.validationError(req, 'All password fields are required', {
        missingFields: validation.missingFields
      })
    );
  }

  // Check new passwords match
  if (new_password !== confirm_password) {
    logger.debug('Change password - new passwords do not match', {
      correlationId,
      context: { userId }
    });
    return res.status(400).json(
      responseUtil.validationError(req, 'New passwords do not match', {
        confirm_password: 'Must match new_password'
      })
    );
  }

  // Check old and new are different
  if (old_password === new_password) {
    logger.debug('Change password - same as old password', {
      correlationId,
      context: { userId }
    });
    return res.status(400).json(
      responseUtil.validationError(req, 'New password must be different from current password', {
        new_password: 'Cannot be same as old password'
      })
    );
  }

  // Validate new password strength
  const pwdValidation = validationUtil.validatePasswordStrength(new_password);
  if (!pwdValidation.isValid) {
    logger.debug('Change password - weak password', {
      correlationId,
      context: { userId }
    });
    return res.status(400).json(
      responseUtil.validationError(req, 'New password does not meet strength requirements', {
        new_password: pwdValidation.errors[0]
      })
    );
  }

  try {
    // Get user with password
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { include: ['password'] }
    });

    if (!user) {
      logger.warn('Change password - user not found', {
        correlationId,
        context: { userId }
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'User not found')
      );
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(old_password, user.password);
    if (!isPasswordValid) {
      logger.warn('Change password - incorrect old password', {
        correlationId,
        context: { userId, email: user.email }
      });
      await auditUtil.logAction({
        userId,
        action: 'password_change_failed',
        details: { reason: 'incorrect_old_password' },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'Current password is incorrect')
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { user_id: userId } }
    );

    // Log action
    await auditUtil.logPasswordChange(req, userId, 'changed');

    logger.info('Password changed successfully', {
      correlationId,
      context: { userId, email: user.email }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Password changed successfully', { email: user.email })
    );
  } catch (error) {
    logger.error('Change password failed', {
      correlationId,
      context: { userId },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to change password')
    );
  }
};

// Unlock account (Admin only)
exports.unlockAccount = async (req, res) => {
  const { email } = req.body;
  const correlationId = req.correlationId;
  const adminId = req.user?.user_id;

  // ===== VALIDATION =====
  if (!email) {
    logger.debug('Unlock account - email missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Email is required', { email: 'Required' })
    );
  }

  if (!validationUtil.isValidEmail(email)) {
    logger.debug('Unlock account - invalid email format', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Invalid email format', { email: 'Invalid format' })
    );
  }

  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn('Unlock account - user not found', {
        correlationId,
        context: { email }
      });
      return res.status(404).json(
        responseUtil.notFound(req, 'User with this email not found')
      );
    }

    // Unlock account
    await User.update(
      {
        lock_up: false,
        login_attempt: 0
      },
      { where: { user_id: user.user_id } }
    );

    // Log action
    await auditUtil.logAccountUnlock(req, user.user_id);

    logger.info('Account unlocked by admin', {
      correlationId,
      context: {
        userId: user.user_id,
        email,
        unlockedBy: adminId
      }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Account unlocked successfully', {
        user_id: user.user_id,
        email: user.email
      })
    );
  } catch (error) {
    logger.error('Unlock account failed', {
      correlationId,
      context: { email },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to unlock account')
    );
  }
};

// Delete account (User self-service deletion)
exports.deleteAccount = async (req, res) => {
  const { password } = req.body;
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;

  if (!userId) {
    logger.warn('Delete account - no user ID', { correlationId });
    return res.status(401).json(
      responseUtil.unauthorized(req, 'User not authenticated')
    );
  }

  // ===== VALIDATION =====
  if (!password) {
    logger.debug('Delete account - password missing', { correlationId, context: { userId } });
    return res.status(400).json(
      responseUtil.validationError(req, 'Password confirmation is required', { password: 'Required' })
    );
  }

  try {
    // Get user with password
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { include: ['password'] }
    });

    if (!user) {
      logger.warn('Delete account - user not found', {
        correlationId,
        context: { userId }
      });
      return res.status(404).json(
        responseUtil.notFound(req, 'User not found')
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Delete account - incorrect password', {
        correlationId,
        context: { userId, email: user.email }
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'Password is incorrect')
      );
    }

    const userEmail = user.email;

    // Delete user (soft delete or hard delete based on business logic)
    // Option 1: Soft delete - keep data for compliance
    // await User.update({ is_active: false }, { where: { user_id: userId } });

    // Option 2: Hard delete - remove all user data
    await User.destroy({ where: { user_id: userId } });

    // Log action
    await auditUtil.logAccountDeletion(req, userId, userEmail);

    logger.info('Account deleted by user', {
      correlationId,
      context: { userId, email: userEmail }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Account deleted successfully', {
        message: 'Your account has been permanently deleted'
      })
    );
  } catch (error) {
    logger.error('Delete account failed', {
      correlationId,
      context: { userId },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to delete account')
    );
  }
};

// Verify email address
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  const correlationId = req.correlationId;

  if (!token) {
    logger.debug('Verify email - token missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Verification token is required', { token: 'Required' })
    );
  }

  try {
    // Verify token
    const tokenVerification = await tokenUtil.verifyEmailVerificationToken(token);
    if (!tokenVerification.is_valid) {
      logger.warn('Verify email - invalid token', {
        correlationId,
        context: { reason: tokenVerification.reason }
      });
      return res.status(401).json(
        responseUtil.unauthorized(req, `Email verification failed: ${tokenVerification.reason}`)
      );
    }

    const userId = tokenVerification.user_id;
    const verifiedEmail = tokenVerification.email;

    // Get user
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      logger.warn('Verify email - user not found', { correlationId, context: { userId } });
      return res.status(401).json(
        responseUtil.unauthorized(req, 'Email verification failed: User not found')
      );
    }

    // Mark email as verified
    await User.update(
      {
        email_verified: true,
        email_verified_at: new Date()
      },
      { where: { user_id: userId } }
    );

    // Mark token as verified
    await tokenUtil.markEmailAsVerified(tokenVerification.token_id);

    // Log action
    await auditUtil.logAction({
      userId,
      action: 'email_verified',
      details: { email: verifiedEmail },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    logger.info('Email verified successfully', {
      correlationId,
      context: { userId, email: verifiedEmail }
    });

    return res.status(200).json(
      responseUtil.success(req, 'Email verified successfully', {
        email: verifiedEmail,
        user_id: userId
      })
    );
  } catch (error) {
    logger.error('Email verification failed', {
      correlationId,
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to verify email')
    );
  }
};

/**
 * Resend verification email
 * 
 * User requests another verification email if they didn't receive the first one.
 */
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const correlationId = req.correlationId;

  // ===== VALIDATION =====
  if (!email) {
    logger.debug('Resend verification - email missing', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Email is required', { email: 'Required' })
    );
  }

  if (!validationUtil.isValidEmail(email)) {
    logger.debug('Resend verification - invalid email format', { correlationId });
    return res.status(400).json(
      responseUtil.validationError(req, 'Invalid email format', { email: 'Invalid format' })
    );
  }

  try {
    // Find user
    const user = await User.findOne({ where: { email } });

    // Security: Always return success message
    const successResponse = {
      success: true,
      message: 'If an account exists with this email and is not yet verified, a verification email will be sent shortly.',
      status_code: 200
    };

    if (!user) {
      logger.info('Resend verification attempt with non-existent email', {
        correlationId,
        context: { email }
      });
      return res.status(200).json(successResponse);
    }

    // Check if email already verified
    if (user.email_verified) {
      logger.info('Resend verification - email already verified', {
        correlationId,
        context: { userId: user.user_id, email }
      });
      return res.status(200).json(successResponse);
    }

    // Create new verification token
    const { token } = await tokenUtil.createEmailVerificationToken(user.user_id, email);

    // Send verification email
    const emailSent = await sendTokenEmail(email, token, 'verification');

    // Log action
    await auditUtil.logAction({
      userId: user.user_id,
      action: 'verification_email_resent',
      details: { email, emailSent },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    logger.info('Verification email resent', {
      correlationId,
      context: { userId: user.user_id, email, emailSent }
    });

    return res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Resend verification email failed', {
      correlationId,
      context: { email },
      error
    });
    return res.status(500).json(
      responseUtil.serverError(req, 'Failed to resend verification email')
    );
  }
};
