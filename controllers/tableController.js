/** Table Controller - HTTP handlers for table management */

const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { tableService } = require('../services');
const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const Table = db.Table;

// Create table
exports.createTable = async (req, res) => {
  const correlationId = req.correlationId;
  const { table_name, branch_id, description } = req.body;

  try {
    const newTable = await Table.create({
      rid: ridUtil.generateRid('tbl'),
      table_name,
      branch_id,
      description
    });

    return res.status(201).json(responseUtil.success(req,
      'Tạo bàn thành công',
      newTable,
      201
    ));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json(responseUtil.conflict(req,
        'RID đã tồn tại trong hệ thống'
      ));
    }
    logger.error('Create table failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi tạo bàn'
    ));
  }
};

// Get all tables by branch
exports.getAllTablesByBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id } = req.query;

  if (!branch_id) {
    return res.status(400).json(responseUtil.validationError(req,
      'Branch ID là bắt buộc',
      { branch_id: 'Branch ID không được để trống' }
    ));
  }

  try {
    const tables = await tableService.getAllTables(branch_id);

    return res.json(responseUtil.success(req,
      `Lấy danh sách ${tables.length} bàn thành công`,
      tables
    ));
  } catch (error) {
    logger.error('Get tables by branch failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy danh sách bàn'
    ));
  }
};

// Get table detail
exports.getTableDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const table = await tableService.getTableById(id);

    if (!table) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy bàn hoặc bàn đã bị xóa'
      ));
    }

    return res.json(responseUtil.success(req,
      'Lấy thông tin bàn thành công',
      table
    ));
  } catch (error) {
    logger.error('Get table detail failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy thông tin bàn'
    ));
  }
};

// Update table
exports.updateTable = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { table_name, description } = req.body;

  try {
    const [updatedRows] = await Table.update(
      { table_name, description },
      { where: { table_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy bàn hoặc bàn đã bị xóa'
      ));
    }

    const updatedTable = await tableService.getTableById(id);

    return res.json(responseUtil.success(req,
      'Cập nhật bàn thành công',
      updatedTable
    ));
  } catch (error) {
    logger.error('Update table failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi cập nhật bàn'
    ));
  }
};

// Delete table (soft delete)
exports.deleteTable = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const [updatedRows] = await Table.update(
      { is_delete: true },
      { where: { table_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy bàn hoặc bàn đã bị xóa'
      ));
    }

    return res.json(responseUtil.success(req,
      'Xóa bàn thành công'
    ));
  } catch (error) {
    logger.error('Delete table failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi xóa bàn'
    ));
  }
};