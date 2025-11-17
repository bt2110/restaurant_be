/** User Service - User management operations
 * getAllUsers, getUserById, updateUser, deleteUser, getUserBranches
 * getUserPermissions, hasPermission, hasAnyPermission, changeUserRole, countUsersByRole
 */

const db = require('../models');
const bcrypt = require('bcryptjs');
const auditUtil = require('../utils/auditUtil');
const ridUtil = require('../utils/ridUtil');

const { User, Role, UserBranch, Branch } = db;

// Get all users with pagination & filters
exports.getAllUsers = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (filters.role_id) where.role_id = filters.role_id;
  if (filters.is_active !== undefined) where.is_active = filters.is_active;
  if (filters.search) {
    where[db.Sequelize.Op.or] = [
      { user_name: { [db.Sequelize.Op.iLike]: `%${filters.search}%` } },
      { email: { [db.Sequelize.Op.iLike]: `%${filters.search}%` } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    include: [{
      model: db.Role,
      as: 'role',
      attributes: ['role_id', 'role_name', 'permissions']
    }],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    subQuery: false
  });

  return {
    users: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

// Create user - Hash password, create user account
exports.create = async (userData) => {
  const { user_name, password, email, role_id } = userData;

  if (!user_name || !password) {
    throw new Error('user_name and password are required');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    rid: ridUtil.generateRid('usr'),
    user_name,
    password: hashedPassword,
    email: email || null,
    role_id: role_id || 4,
    is_active: true
  });

  return user;
};

// Get user by ID with role & branches
exports.getUserById = async (userId) => {
  const user = await User.findOne({
    where: { user_id: userId },
    include: [
      {
        model: db.Role,
        as: 'role',
        attributes: ['role_id', 'role_name', 'permissions', 'is_active']
      },
      {
        model: db.Branch,
        through: db.UserBranch,
        attributes: ['branch_id', 'branch_name']
      }
    ]
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

// Update user info - Allow name, phone, address, role, active status
exports.updateUser = async (userId, updateData) => {
  const user = await User.findOne({ where: { user_id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // Allow only specific fields to be updated
  const allowedFields = ['user_name', 'user_phone', 'user_address', 'role_id', 'is_active'];
  const updates = {};

  for (const field of allowedFields) {
    if (field in updateData) {
      updates[field] = updateData[field];
    }
  }

  // Update user
  await user.update(updates);

  // Fetch updated user with role
  const updatedUser = await exports.getUserById(userId);

  return updatedUser;
};

// Delete user soft delete - Mark is_delete=true, log action
exports.deleteUser = async (userId, auditContext = {}) => {
  const user = await User.findOne({ where: { user_id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // Hard delete
  await User.destroy({ where: { user_id: userId } });

  // Log deletion
  await auditUtil.logAction(userId, 'account_deleted', {
    deleted_user_id: userId,
    ...auditContext
  });

  return { success: true, message: 'User deleted successfully' };
};

// Assign user to branches - Remove old, create new assignments
exports.assignBranches = async (userId, branchIds) => {
  const user = await User.findOne({ where: { user_id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify all branches exist
  const branches = await Branch.findAll({
    where: { branch_id: branchIds }
  });

  if (branches.length !== branchIds.length) {
    throw new Error('One or more branches not found');
  }

  // Remove old assignments and create new ones
  await UserBranch.destroy({ where: { user_id: userId } });
  
  for (const branchId of branchIds) {
    await UserBranch.create({ user_id: userId, branch_id: branchId });
  }

  return {
    success: true,
    message: 'User assigned to branches successfully',
    branches
  };
};

// Get user branches - Fetch all branch assignments
exports.getUserBranches = async (userId) => {
  return await User.findOne({
    where: { user_id: userId },
    include: [{
      model: Branch,
      through: { attributes: [] },
      attributes: ['branch_id', 'branch_name', 'description']
    }]
  }).then(u => u?.Branches || []);
};

// Get user permissions - Fetch role permissions
exports.getUserPermissions = async (userId) => {
  const user = await User.findOne({
    where: { user_id: userId },
    include: [{
      model: Role,
      as: 'role',
      attributes: ['permissions']
    }]
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.role?.permissions || {};
};

// Check user has permission - Verify specific permission
exports.hasPermission = async (userId, permission) => {
  const permissions = await exports.getUserPermissions(userId);
  return permissions[permission] === true;
};

// Check user has any permission - Verify at least one permission
exports.hasAnyPermission = async (userId, permissions) => {
  const userPermissions = await exports.getUserPermissions(userId);
  return permissions.some(perm => userPermissions[perm] === true);
};

// Change user role - Verify role exists, update, log action
exports.changeUserRole = async (userId, newRoleId, auditContext = {}) => {
  const user = await User.findOne({ where: { user_id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify role exists
  const role = await Role.findOne({ where: { role_id: newRoleId } });
  if (!role) {
    throw new Error('Role not found');
  }

  const oldRoleId = user.role_id;
  user.role_id = newRoleId;
  await user.save();

  // Log role change
  await auditUtil.logAction(userId, 'role_changed', {
    old_role_id: oldRoleId,
    new_role_id: newRoleId,
    ...auditContext
  });

  return await exports.getUserById(userId);
};

// Count users by role - Group and count users per role
exports.countUsersByRole = async () => {
  return await User.findAll({
    where: { is_delete: false },
    attributes: [
      'role_id',
      [db.Sequelize.fn('COUNT', db.Sequelize.col('user_id')), 'count']
    ],
    include: [{
      model: Role,
      as: 'role',
      attributes: ['role_name']
    }],
    group: ['role_id', 'role.role_id'],
    raw: true
  });
};

// Get user statistics - Count active, locked, verified users
exports.getUserStatistics = async () => {
  const total = await User.count({ where: { is_delete: false } });
  const active = await User.count({ where: { is_delete: false, is_active: true } });
  const locked = await User.count({ where: { is_delete: false, lock_up: true } });
  const emailVerified = await User.count({ where: { is_delete: false, email_verified: true } });

  return {
    total,
    active,
    inactive: total - active,
    locked,
    emailVerified,
    notVerified: total - emailVerified
  };
};
