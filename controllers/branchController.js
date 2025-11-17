/** Branch Controller - HTTP handlers for branch management */

const db = require('../models');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { branchService } = require('../services');
const ridUtil = require('../utils/ridUtil');
const Branch = db.Branch;

// Get all branches
exports.getAllBranches = async (req, res) => {
  const correlationId = req.correlationId;

  try {
    logger.debug('Fetching all branches', { correlationId });

    const branches = await Branch.findAll({
      where: { is_delete: false },
      include: [{
        model: db.User,
        attributes: ['user_id', 'user_name', 'email'],
        through: { attributes: [] }
      }]
    });

    logger.info('Branches retrieved successfully', {
      correlationId,
      context: { count: branches.length }
    });

    return res.json(responseUtil.success(req,
      `Lấy danh sách ${branches.length} chi nhánh thành công`,
      branches
    ));
  } catch (error) {
    logger.error('Get all branches failed', {
      correlationId,
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy danh sách chi nhánh'
    ));
  }
};

// Get branch detail
exports.getBranchDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Fetching branch detail', {
      correlationId,
      context: { branchId: id }
    });

    const branch = await Branch.findOne({
      where: { branch_id: id, is_delete: false },
      include: [
        {
          model: db.Table,
          where: { is_delete: false },
          required: false
        },
        {
          model: db.MenuCategory,
          where: { is_delete: false },
          required: false
        },
        {
          model: db.User,
          attributes: ['user_id', 'user_name', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    if (!branch) {
      logger.warn('Branch not found', {
        correlationId,
        context: { branchId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy chi nhánh hoặc chi nhánh đã bị xóa'
      ));
    }

    logger.info('Branch detail retrieved successfully', {
      correlationId,
      context: { branchId: id, branch_name: branch.branch_name }
    });

    return res.json(responseUtil.success(req,
      'Lấy thông tin chi nhánh thành công',
      branch
    ));
  } catch (error) {
    logger.error('Get branch detail failed', {
      correlationId,
      context: { branchId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy thông tin chi nhánh'
    ));
  }
};

// Create branch
exports.createBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_name, description } = req.body;

  try {
    const newBranch = await Branch.create({
      rid: ridUtil.generateRid('br'),
      branch_name,
      description,
      is_delete: false
    });

    return res.status(201).json(responseUtil.success(req,
      'Tạo chi nhánh thành công',
      newBranch,
      201
    ));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json(responseUtil.conflict(req,
        'RID đã tồn tại trong hệ thống'
      ));
    }
    logger.error('Create branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi tạo chi nhánh'
    ));
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { branch_name, description } = req.body;

  try {
    const [updatedRows] = await Branch.update(
      { branch_name, description },
      { where: { branch_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy chi nhánh hoặc chi nhánh đã bị xóa'
      ));
    }

    const updatedBranch = await Branch.findByPk(id);

    return res.json(responseUtil.success(req,
      'Cập nhật chi nhánh thành công',
      updatedBranch
    ));
  } catch (error) {
    logger.error('Update branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi cập nhật chi nhánh'
    ));
  }
};

// Delete branch (soft delete)
exports.deleteBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const [updatedRows] = await Branch.update(
      { is_delete: true },
      { where: { branch_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy chi nhánh hoặc chi nhánh đã bị xóa'
      ));
    }

    return res.json(responseUtil.success(req,
      'Xóa chi nhánh thành công'
    ));
  } catch (error) {
    logger.error('Delete branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi xóa chi nhánh'
    ));
  }
};