/**
 * Authentication Service - User auth operations
 * Register (customer/staff), Login, Password reset, Email verification
 */

const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auditUtil = require('../utils/auditUtil');
const tokenUtil = require('../utils/tokenUtil');
const ridUtil = require('../utils/ridUtil');
const validationUtil = require('../utils/validationUtil');

const { User, Role, PasswordResetToken, EmailVerificationToken } = db;

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (user, role = null) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      user_name: user.user_name,
      role_id: user.role_id,
      role_name: role?.role_name || 'customer',
      permissions: role?.permissions || {}
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Get user with role info
const getUserWithRole = async (userId) => {
  return await User.findOne({
    where: { user_id: userId },
    include: [{
      model: Role,
      as: 'role',
      attributes: ['role_id', 'role_name', 'permissions', 'is_active']
    }]
  });
};

/**
 * Register user - Customer signup or Admin create staff
 * Mode 1: No auth -> Create customer (role=4), return JWT
 * Mode 2: Admin/Manager -> Create staff (role=1-3), no JWT
 */
exports.register = async (data, authenticatedUser = null) => {
  const { user_name, password, email, role_id } = data;
  
  // Determine mode
  const isAuthenticated = !!authenticatedUser;
  const userRole = authenticatedUser?.role_id;
  const isStaffCreation = isAuthenticated && (userRole === 1 || userRole === 2);
  const isCustomerSignup = !isAuthenticated;

  // ===== VALIDATION =====
  if (isCustomerSignup) {
    // Customer mode: Email required
    const validation = validationUtil.validateRequiredFields(data, ['user_name', 'password', 'email']);
    if (!validation.isValid) {
      throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
    }

    if (!validationUtil.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
  } else if (isStaffCreation) {
    // Staff mode: user_name and password required
    const validation = validationUtil.validateRequiredFields(data, ['user_name', 'password']);
    if (!validation.isValid) {
      throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
    }

    if (email && !validationUtil.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (role_id && ![1, 2, 3].includes(role_id)) {
      throw new Error('Invalid role_id. Must be 1 (admin), 2 (manager), or 3 (staff)');
    }
  } else {
    // Unauthorized: authenticated but not admin/manager
    throw new Error('Only admin/manager can create staff accounts');
  }

  // Validate password strength
  const pwdValidation = validationUtil.validatePasswordStrength(password);
  if (!pwdValidation.isValid) {
    throw new Error(`Password does not meet strength requirements: ${pwdValidation.errors[0]}`);
  }

  // Check duplicate email
  if (email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('Email is already registered');
    }
  }

  // ===== CREATE USER =====
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Determine role
  let assignedRoleId = 4; // Default: customer
  if (isStaffCreation) {
    assignedRoleId = role_id || 3; // Default to staff if not specified
  }

  const newUser = await User.create({
    rid: ridUtil.generateRid('usr'),
    user_name,
    password: hashedPassword,
    email: email || null,
    role_id: assignedRoleId,
    lock_up: false
  });

  // Fetch user with role
  const userWithRole = await getUserWithRole(newUser.user_id);

  const responseData = {
    user: {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      email: newUser.email,
      role_id: newUser.role_id,
      role: userWithRole.role
    }
  };

  // Return token only for customer mode
  if (isCustomerSignup) {
    const token = generateToken(newUser, userWithRole.role);
    responseData.token = token;
    responseData.expiresIn = JWT_EXPIRES_IN;
  }

  return responseData;
};

/**
 * Login user - Email + password authentication
 * Tracks failed attempts, locks after 5 attempts
 */
exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('Email or password is incorrect');
  }

  // Check if account is locked
  if (user.lock_up) {
    throw new Error('Account is locked. Please contact administrator');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Increment login attempt
    user.login_attempt = (user.login_attempt || 0) + 1;
    
    // Lock account after 5 attempts
    if (user.login_attempt >= 5) {
      user.lock_up = true;
      user.lock_up_at = new Date();
    }
    
    await user.save();
    throw new Error('Email or password is incorrect');
  }

  // Reset login attempts on successful login
  if (user.login_attempt > 0) {
    user.login_attempt = 0;
  }
  user.last_login = new Date();
  await user.save();

  // Get user with role
  const userWithRole = await getUserWithRole(user.user_id);

  const token = generateToken(user, userWithRole.role);

  return {
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role_id: user.role_id,
      role: userWithRole.role
    },
    token,
    expiresIn: JWT_EXPIRES_IN
  };
};

/**
 * Request password reset - Generate & send reset token to email
 * Doesn't reveal if email exists (security)
 */
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    // Don't reveal if email exists (security)
    return { success: true, message: 'If email exists, reset link has been sent' };
  }

  // Create reset token
  const token = await tokenUtil.generatePasswordResetToken(user.user_id);

  // TODO: Send email with reset link
  // await sendEmail(email, 'Password Reset', resetLink);

  return {
    success: true,
    message: 'Password reset link sent to email',
    token // In production, remove this line
  };
};

/**
 * Reset password - Validate token, update password, mark token used
 */
exports.resetPassword = async (token, newPassword) => {
  // Validate password strength
  const validation = validationUtil.validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password does not meet strength requirements: ${validation.errors[0]}`);
  }

  // Verify token
  const resetToken = await PasswordResetToken.findOne({ where: { token } });
  
  if (!resetToken || resetToken.is_used) {
    throw new Error('Invalid or expired reset token');
  }

  if (new Date() > resetToken.expires_at) {
    throw new Error('Reset token has expired');
  }

  // Update password
  const user = await User.findOne({ where: { user_id: resetToken.user_id } });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Mark token as used
  resetToken.is_used = true;
  resetToken.used_at = new Date();
  await resetToken.save();

  return { success: true, message: 'Password reset successfully' };
};

/**
 * Change password - Verify old password, validate & hash new password
 */
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findOne({ where: { user_id: userId } });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    throw new Error('Old password is incorrect');
  }

  // Validate new password
  const validation = validationUtil.validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password does not meet strength requirements: ${validation.errors[0]}`);
  }

  // Update password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return { success: true, message: 'Password changed successfully' };
};

/**
 * Verify email - Validate token, mark user verified, mark token verified
 */
exports.verifyEmail = async (token) => {
  const verificationToken = await EmailVerificationToken.findOne({ where: { token } });
  
  if (!verificationToken || verificationToken.is_verified) {
    throw new Error('Invalid or already verified token');
  }

  if (new Date() > verificationToken.expires_at) {
    throw new Error('Verification token has expired');
  }

  // Update user email_verified status
  const user = await User.findOne({ where: { user_id: verificationToken.user_id } });
  user.email_verified = true;
  user.email_verified_at = new Date();
  await user.save();

  // Mark token as verified
  verificationToken.is_verified = true;
  verificationToken.verified_at = new Date();
  await verificationToken.save();

  return { success: true, message: 'Email verified successfully' };
};

/**
 * Resend verification email - Generate & send new verification token
 * Doesn't reveal if email exists (security)
 */
exports.resendVerificationEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    return { success: true, message: 'If email exists, verification link has been sent' };
  }

  if (user.email_verified) {
    throw new Error('Email is already verified');
  }

  // Create new verification token
  const token = await tokenUtil.generateEmailVerificationToken(user.user_id, email);

  // TODO: Send email with verification link
  // await sendEmail(email, 'Verify Email', verificationLink);

  return {
    success: true,
    message: 'Verification email sent',
    token // In production, remove this line
  };
};

/**
 * Unlock account - Reset lock status & login attempts (admin only)
 */
exports.unlockAccount = async (userId) => {
  const user = await User.findOne({ where: { user_id: userId } });
  
  if (!user) {
    throw new Error('User not found');
  }

  user.lock_up = false;
  user.login_attempt = 0;
  await user.save();

  return { success: true, message: 'Account unlocked successfully' };
};

/**
 * Get user profile - Fetch user with role information
 */
exports.getProfile = async (userId) => {
  const user = await getUserWithRole(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Logout user - Record logout action in audit log
 */
exports.logout = async (userId, requestContext = {}) => {
  // Log logout action
  await auditUtil.logAction(userId, 'logout', {
    message: 'User logged out',
    ...requestContext
  });

  return { success: true, message: 'Logged out successfully' };
};
