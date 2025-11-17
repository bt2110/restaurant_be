/** Role Routes - Role management endpoints */

const express = require('express');
const router = express.Router();
const db = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const validationUtil = require('../utils/validationUtil');
const Role = db.Role;

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Lấy danh sách tất cả roles
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách roles
 *       500:
 *         description: Lỗi server
 */
// Get all roles
router.get('/', verifyToken, async (req, res) => {
  const correlationId = req.correlationId;
  try {
    logger.debug('Fetching all roles', { correlationId });
    const roles = await Role.findAll({
      attributes: ['role_id', 'role_name', 'description', 'permissions', 'is_active', 'created_at', 'updated_at']
    });
    logger.info('Roles retrieved successfully', { correlationId, context: { count: roles.length } });
    return res.json(responseUtil.success(req, `Lấy danh sách ${roles.length} vai trò thành công`, roles));
  } catch (error) {
    logger.error('Get all roles failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi lấy danh sách vai trò'));
  }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Lấy chi tiết một role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Chi tiết role
 *       404:
 *         description: Role không tìm thấy
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', verifyToken, async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  try {
    logger.debug('Fetching role detail', { correlationId, context: { roleId: id } });
    const role = await Role.findByPk(id);
    if (!role) {
      logger.warn('Role not found', { correlationId, context: { roleId: id } });
      return res.status(404).json(responseUtil.notFound(req, 'Vai trò'));
    }
    logger.info('Role detail retrieved', { correlationId, context: { roleId: id, role_name: role.role_name } });
    return res.json(responseUtil.success(req, 'Lấy chi tiết vai trò thành công', role));
  } catch (error) {
    logger.error('Get role detail failed', { correlationId, context: { roleId: id }, error });
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi lấy chi tiết vai trò'));
  }
});

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Tạo role mới
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['role_name', 'permissions']
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: 'supervisor'
 *               description:
 *                 type: string
 *                 example: 'Supervisor role'
 *               permissions:
 *                 type: object
 *                 example: {"create_order": true, "manage_users": false}
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Role tạo thành công
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Only admin can create roles
 *       409:
 *         description: Duplicate role name
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const correlationId = req.correlationId;
  const { role_name, description, permissions, is_active } = req.body;

  // ========== VALIDATION ==========
  const validation = validationUtil.validateRequiredFields(req.body, ['role_name', 'permissions']);
  if (!validation.isValid) {
    logger.warn('Create role validation failed', { correlationId, context: { missingFields: validation.missingFields } });
    return res.status(400).json(responseUtil.validationError(req, 'role_name và permissions là bắt buộc', validation.missingFields));
  }

  try {
    logger.debug('Creating new role', { correlationId, context: { role_name } });
    const newRole = await Role.create({
      role_name,
      description,
      permissions,
      is_active: is_active !== undefined ? is_active : true
    });
    logger.info('Role created successfully', { correlationId, context: { roleId: newRole.role_id, role_name } });
    return res.status(201).json(responseUtil.success(req, 'Tạo vai trò thành công', newRole, 201));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.warn('Create role duplicate name', { correlationId, context: { role_name } });
      return res.status(409).json(responseUtil.conflict(req, 'Tên vai trò đã tồn tại'));
    }
    logger.error('Create role failed', { correlationId, context: { role_name }, error });
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi tạo vai trò'));
  }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Cập nhật role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               permissions:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role cập nhật thành công
 *       403:
 *         description: Forbidden - Only admin
 *       404:
 *         description: Role không tìm thấy
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { description, permissions, is_active } = req.body;

  try {
    logger.debug('Updating role', { correlationId, context: { roleId: id } });
    const role = await Role.findByPk(id);

    if (!role) {
      logger.warn('Update role not found', { correlationId, context: { roleId: id } });
      return res.status(404).json(responseUtil.notFound(req, 'Vai trò'));
    }

    // Don't allow changing built-in roles (id 1-4)
    if (id <= 4) {
      logger.warn('Attempt to update system role', { correlationId, context: { roleId: id } });
      return res.status(403).json(responseUtil.forbidden(req, 'Không thể sửa vai trò mặc định của hệ thống'));
    }

    await role.update({
      description: description !== undefined ? description : role.description,
      permissions: permissions !== undefined ? permissions : role.permissions,
      is_active: is_active !== undefined ? is_active : role.is_active
    });

    logger.info('Role updated successfully', { correlationId, context: { roleId: id, role_name: role.role_name } });
    return res.json(responseUtil.success(req, 'Cập nhật vai trò thành công', role));
  } catch (error) {
    logger.error('Update role failed', { correlationId, context: { roleId: id }, error });
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi cập nhật vai trò'));
  }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Xóa role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role xóa thành công
 *       403:
 *         description: Forbidden - Only admin / Cannot delete built-in roles
 *       404:
 *         description: Role không tìm thấy
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Deleting role', { correlationId, context: { roleId: id } });
    const role = await Role.findByPk(id);

    if (!role) {
      logger.warn('Delete role not found', { correlationId, context: { roleId: id } });
      return res.status(404).json(responseUtil.notFound(req, 'Vai trò'));
    }

    // Don't allow deleting built-in roles
    if (id <= 4) {
      logger.warn('Attempt to delete system role', { correlationId, context: { roleId: id } });
      return res.status(403).json(responseUtil.forbidden(req, 'Không thể xóa vai trò mặc định của hệ thống'));
    }

    await role.destroy();
    logger.info('Role deleted successfully', { correlationId, context: { roleId: id, role_name: role.role_name } });
    return res.json(responseUtil.success(req, 'Xóa vai trò thành công'));
  } catch (error) {
    logger.error('Delete role failed', { correlationId, context: { roleId: id }, error });
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi xóa vai trò'));
  }
});

module.exports = router;
