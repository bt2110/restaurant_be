/** Notification Controller - HTTP handlers for notifications */

const db = require('../models');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { notificationService } = require('../services');
const ridUtil = require('../utils/ridUtil');
const Notification = db.Notification;

// Create notification
exports.createNotification = async (req, res) => {
  const correlationId = req.correlationId;
  const { order_id, branch_id } = req.body;

  try {
    const newNotification = await Notification.create({
      rid: ridUtil.generateRid('notif'),
      order_id: order_id || null,
      branch_id,
      status_admin: 0,
      status_client: 0
    });

    return res.status(201).json(responseUtil.success(req,
      'Tạo thông báo thành công',
      newNotification,
      201
    ));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json(responseUtil.conflict(req,
        'RID đã tồn tại trong hệ thống'
      ));
    }
    logger.error('Create notification failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi tạo thông báo'
    ));
  }
};

// Get notifications by branch
exports.getNotificationsByBranch = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id, status_admin } = req.query;

  if (!branch_id) {
    return res.status(400).json(responseUtil.validationError(req,
      'Branch ID là bắt buộc',
      { branch_id: 'Branch ID không được để trống' }
    ));
  }

  try {
    let whereClause = { branch_id };
    
    if (status_admin !== undefined) {
      whereClause.status_admin = status_admin;
    }
    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['sent_time', 'DESC']],  // Newest first
      limit: 50,
      include: [{ 
        model: db.Order, 
        attributes: ['order_id', 'rid', 'order_status'] 
      }]
    });

    logger.info('Notifications retrieved successfully', {
      correlationId,
      context: { branch_id, count: notifications.length }
    });

    return res.json(responseUtil.success(req,
      `Lấy danh sách ${notifications.length} thông báo thành công`,
      notifications
    ));
  } catch (error) {
    logger.error('Get notifications by branch failed', {
      correlationId,
      context: { branch_id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy danh sách thông báo'
    ));
  }
};

// Update notification status
exports.updateNotificationStatus = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { status_admin, status_client } = req.body;

  try {
    const [updatedRows] = await Notification.update(
      { status_admin, status_client },
      { where: { notification_id: id } }
    );

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy thông báo'
      ));
    }

    return res.json(responseUtil.success(req,
      'Cập nhật trạng thái thông báo thành công'
    ));
  } catch (error) {
    logger.error('Update notification status failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi cập nhật trạng thái thông báo'
    ));
  }
};