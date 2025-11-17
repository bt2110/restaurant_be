/** Token Utility - Password reset & email verification tokens */

const crypto = require('crypto');
const db = require('../models');
const logger = require('../middleware/logger');

const { PasswordResetToken, EmailVerificationToken } = db;

// Constants
const RESET_TOKEN_EXPIRY_MINUTES = 15; // 15 minutes
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24; // 24 hours

// Generate secure random token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create password reset token
exports.createPasswordResetToken = async (userId) => {
  try {
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    const resetToken = await PasswordResetToken.create({
      user_id: userId,
      token,
      expires_at: expiresAt
    });

    logger.info('Password reset token created', {
      context: { userId, expiresAt }
    });

    return {
      token,
      expires_at: expiresAt
    };
  } catch (error) {
    logger.error('Failed to create password reset token', {
      context: { userId },
      error
    });
    throw error;
  }
};

// Verify password reset token
exports.verifyPasswordResetToken = async (token) => {
  try {
    const resetToken = await PasswordResetToken.findOne({
      where: { token }
    });

    if (!resetToken) {
      logger.warn('Password reset token not found', { context: { token: token.substring(0, 10) + '...' } });
      return { is_valid: false, user_id: null, reason: 'Token not found' };
    }

    // Check if already used
    if (resetToken.is_used) {
      logger.warn('Password reset token already used', { context: { userId: resetToken.user_id } });
      return { is_valid: false, user_id: null, reason: 'Token already used' };
    }

    // Check if expired
    if (new Date() > resetToken.expires_at) {
      logger.warn('Password reset token expired', { context: { userId: resetToken.user_id } });
      return { is_valid: false, user_id: null, reason: 'Token expired' };
    }

    return { is_valid: true, user_id: resetToken.user_id, token_id: resetToken.id };
  } catch (error) {
    logger.error('Failed to verify password reset token', {
      error
    });
    throw error;
  }
};

// Mark password reset token as used
exports.markResetTokenAsUsed = async (tokenId) => {
  try {
    await PasswordResetToken.update(
      {
        is_used: true,
        used_at: new Date()
      },
      { where: { id: tokenId } }
    );
    logger.debug('Password reset token marked as used', { context: { tokenId } });
  } catch (error) {
    logger.error('Failed to mark reset token as used', {
      context: { tokenId },
      error
    });
    throw error;
  }
};

// Create email verification token for user
exports.createEmailVerificationToken = async (userId, email) => {
  try {
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    const verificationToken = await EmailVerificationToken.create({
      user_id: userId,
      token,
      email,
      expires_at: expiresAt
    });

    logger.info('Email verification token created', {
      context: { userId, email, expiresAt }
    });

    return {
      token,
      expires_at: expiresAt
    };
  } catch (error) {
    logger.error('Failed to create email verification token', {
      context: { userId, email },
      error
    });
    throw error;
  }
};

// Verify email verification token
exports.verifyEmailVerificationToken = async (token) => {
  try {
    const verificationToken = await EmailVerificationToken.findOne({
      where: { token }
    });

    if (!verificationToken) {
      logger.warn('Email verification token not found', { context: { token: token.substring(0, 10) + '...' } });
      return { is_valid: false, user_id: null, reason: 'Token not found' };
    }

    // Check if already verified
    if (verificationToken.is_verified) {
      logger.warn('Email verification token already verified', { context: { userId: verificationToken.user_id } });
      return { is_valid: false, user_id: null, reason: 'Email already verified' };
    }

    // Check if expired
    if (new Date() > verificationToken.expires_at) {
      logger.warn('Email verification token expired', { context: { userId: verificationToken.user_id } });
      return { is_valid: false, user_id: null, reason: 'Token expired' };
    }

    return {
      is_valid: true,
      user_id: verificationToken.user_id,
      email: verificationToken.email,
      token_id: verificationToken.id
    };
  } catch (error) {
    logger.error('Failed to verify email verification token', { error });
    throw error;
  }
};

// Mark email verification token as verified
exports.markEmailAsVerified = async (tokenId) => {
  try {
    await EmailVerificationToken.update(
      {
        is_verified: true,
        verified_at: new Date()
      },
      { where: { id: tokenId } }
    );
    logger.debug('Email marked as verified', { context: { tokenId } });
  } catch (error) {
    logger.error('Failed to mark email as verified', {
      context: { tokenId },
      error
    });
    throw error;
  }
};

// Clean up expired tokens (run periodically)
exports.cleanupExpiredTokens = async () => {
  try {
    const now = new Date();

    const resetTokensDeleted = await PasswordResetToken.destroy({
      where: {
        expires_at: { [db.Sequelize.Op.lt]: now },
        is_used: false
      }
    });

    const verificationTokensDeleted = await EmailVerificationToken.destroy({
      where: {
        expires_at: { [db.Sequelize.Op.lt]: now },
        is_verified: false
      }
    });

    logger.info('Expired tokens cleaned up', {
      context: { resetTokensDeleted, verificationTokensDeleted }
    });

    return { resetTokensDeleted, verificationTokensDeleted };
  } catch (error) {
    logger.error('Failed to clean up expired tokens', { error });
    throw error;
  }
};

// Delete specific token by ID
exports.deleteToken = async (tokenType, tokenId) => {
  try {
    const Model = tokenType === 'reset' ? PasswordResetToken : EmailVerificationToken;
    const deleted = await Model.destroy({
      where: { id: tokenId }
    });
    logger.debug(`${tokenType} token deleted`, { context: { tokenId } });
    return deleted;
  } catch (error) {
    logger.error(`Failed to delete ${tokenType} token`, {
      context: { tokenId },
      error
    });
    throw error;
  }
};
