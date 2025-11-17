/** User Controller - User management HTTP handling
 * Delegates business logic to userService
 */

const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const validationUtil = require('../utils/validationUtil');
const { userService } = require('../services');
const db = require('../models');
const { Branch } = db;

// Create user - Staff creation by admin/manager (no auth-based signup)
exports.createUser = async (req, res) => {
  const correlationId = req.correlationId;
  const { user_name, password, email, role_id } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['user_name', 'password']);
  if (!validation.isValid) {
    logger.warn('Create user validation failed', { correlationId, context: { missingFields: validation.missingFields } });
    return res.status(400).json(responseUtil.validationError(req, 'Username and password required', { missingFields: validation.missingFields }));
  }

  if (email && !validationUtil.isValidEmail(email)) {
    logger.warn('Create user email format invalid', { correlationId, context: { email } });
    return res.status(400).json(responseUtil.validationError(req, 'Invalid email format', { email: 'Must be valid email' }));
  }

  try {
    const newUser = await userService.create({
      user_name,
      password,
      email: email || null,
      role_id: role_id || 3
    });

    logger.info('User created successfully', { correlationId, context: { userId: newUser.user_id } });

    return res.status(201).json(responseUtil.success(req, 'User created successfully', {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      email: newUser.email,
      role_id: newUser.role_id
    }, 201));
  } catch (error) {
    logger.error('Create user failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error creating user'));
  }
};


// Get all users - List all active users with pagination
exports.getAllUsers = async (req, res) => {
  const correlationId = req.correlationId;
  const { page = 1, limit = 10, role_id, is_active } = req.query;

  try {
    const filters = {};
    if (role_id) filters.role_id = role_id;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const result = await userService.getAllUsers(parseInt(page), parseInt(limit), filters);

    logger.info('Users retrieved', { correlationId, context: { count: result.total } });

    return res.json(responseUtil.success(req, `Retrieved ${result.total} users`, result));
  } catch (error) {
    logger.error('Get all users failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error retrieving users'));
  }
};

// Get user detail - Fetch single user with role and branches
exports.getUserDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const user = await userService.getUserById(parseInt(id));

    logger.info('User detail retrieved', { correlationId, context: { userId: id } });

    return res.json(responseUtil.success(req, 'User retrieved successfully', user));
  } catch (error) {
    logger.warn('User not found', { correlationId, context: { userId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'User not found'));
  }
};

// Update user - Change name, phone, address, status
exports.updateUser = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { user_name, user_phone, user_address, role_id, is_active } = req.body;

  if (user_name && user_name.trim().length < 2) {
    return res.status(400).json(responseUtil.validationError(req, 'Username must be at least 2 characters'));
  }

  try {
    const updatedUser = await userService.updateUser(parseInt(id), {
      user_name,
      user_phone,
      user_address,
      role_id,
      is_active
    });

    logger.info('User updated', { correlationId, context: { userId: id } });

    return res.json(responseUtil.success(req, 'User updated successfully', updatedUser));
  } catch (error) {
    logger.warn('Update user failed', { correlationId, context: { userId: id }, error });
    return res.status(404).json(responseUtil.notFound(req, 'User not found'));
  }
};

// Delete user - Soft delete user account
exports.deleteUser = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const userId = req.user?.user_id;

  try {
    await userService.deleteUser(parseInt(id), { deleted_by: userId });

    logger.info('User deleted', { correlationId, context: { userId: id } });

    return res.json(responseUtil.success(req, 'User deleted successfully'));
  } catch (error) {
    logger.warn('Delete user failed', { correlationId, context: { userId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'User not found'));
  }
};


// Get users by branch - Fetch all users assigned to branch
exports.getUsersByBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id } = req.query;

  const validation = validationUtil.validateRequiredFields({ branch_id }, ['branch_id']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'branch_id is required'));
  }

  try {
    const branch = await Branch.findOne({
      where: { branch_id: parseInt(branch_id) },
      include: [{
        model: db.User,
        attributes: { exclude: ['password'] },
        through: { attributes: [] }
      }]
    });

    if (!branch) {
      logger.warn('Branch not found', { correlationId, context: { branchId: branch_id } });
      return res.status(404).json(responseUtil.notFound(req, 'Branch not found'));
    }

    logger.info('Branch users retrieved', { correlationId, context: { branchId: branch_id, count: branch.Users.length } });

    return res.json(responseUtil.success(req, `Retrieved ${branch.Users.length} users from branch`, branch.Users));
  } catch (error) {
    logger.error('Get users by branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error retrieving branch users'));
  }
};

// Assign user to branch - Add user to branch assignment
exports.assignUserToBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id, user_id } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['branch_id', 'user_id']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'branch_id and user_id required'));
  }

  try {
    const branches = await userService.assignBranches(parseInt(user_id), [parseInt(branch_id)]);

    logger.info('User assigned to branch', { correlationId, context: { userId: user_id, branchId: branch_id } });

    return res.json(responseUtil.success(req, 'User assigned to branch successfully', { branches }));
  } catch (error) {
    logger.warn('Assign user to branch failed', { correlationId, context: { userId: user_id, branchId: branch_id } });
    return res.status(404).json(responseUtil.notFound(req, 'User or branch not found'));
  }
};

// Remove user from branch - Remove branch assignment
exports.removeUserFromBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id, user_id } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['branch_id', 'user_id']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'branch_id and user_id required'));
  }

  try {
    const user = await db.User.findByPk(parseInt(user_id));
    const branch = await Branch.findByPk(parseInt(branch_id));

    if (!user || !branch) {
      logger.warn('User or branch not found', { correlationId });
      return res.status(404).json(responseUtil.notFound(req, 'User or branch not found'));
    }

    await user.removeBranch(branch);

    logger.info('User removed from branch', { correlationId, context: { userId: user_id, branchId: branch_id } });

    return res.json(responseUtil.success(req, 'User removed from branch successfully'));
  } catch (error) {
    logger.error('Remove user from branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error removing user from branch'));
  }
};

// Assign role to user - Admin only
exports.assignRole = async (req, res) => {
  const correlationId = req.correlationId;
  const { user_id, role_id } = req.body;
  const adminId = req.user?.user_id;

  // Only admin can assign roles
  if (req.user?.role_id !== 1) {
    logger.warn('Unauthorized role assignment attempt', { correlationId, context: { adminId, targetUserId: user_id } });
    return res.status(403).json(responseUtil.forbidden(req, 'Only admin can assign roles'));
  }

  const validation = validationUtil.validateRequiredFields(req.body, ['user_id', 'role_id']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'user_id and role_id required'));
  }

  if (![1, 2, 3, 4].includes(role_id)) {
    return res.status(400).json(responseUtil.validationError(req, 'Invalid role_id. Must be 1-4'));
  }

  try {
    const user = await db.User.findByPk(parseInt(user_id));
    if (!user) {
      logger.warn('User not found for role assignment', { correlationId, context: { userId: user_id } });
      return res.status(404).json(responseUtil.notFound(req, 'User'));
    }

    const oldRoleId = user.role_id;
    await user.update({ role_id });

    logger.info('User role assigned', {
      correlationId,
      context: {
        targetUserId: user_id,
        oldRoleId,
        newRoleId: role_id,
        adminId
      }
    });

    return res.json(responseUtil.success(req, 'Role assigned successfully', {
      user_id: user.user_id,
      user_name: user.user_name,
      old_role_id: oldRoleId,
      new_role_id: role_id
    }));
  } catch (error) {
    logger.error('Assign role failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error assigning role'));
  }
};