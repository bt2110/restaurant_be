/** Notification Service - Notification management operations
 * getUserNotifications, getNotificationById, createNotification, markAsRead, markAllAsRead
 * deleteNotification, getUnreadCount
 */

const db = require('../models');
const { Notification, User } = db;

// Get user notifications
exports.getUserNotifications = async (userId, page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { user_id: userId };

  if (filters.is_read !== undefined) where.is_read = filters.is_read;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { notifications: rows, total: count, page, limit };
};

// Get notification by ID
exports.getNotificationById = async (notificationId) => {
  const notification = await Notification.findOne({
    where: { notification_id: notificationId }
  });

  if (!notification) throw new Error('Notification not found');
  return notification;
};

// Create notification
exports.createNotification = async (data) => {
  const { user_id, title, message, notification_type } = data;

  if (!user_id || !title || !message) {
    throw new Error('user_id, title, and message are required');
  }

  return await Notification.create({
    user_id,
    title,
    message,
    notification_type: notification_type || 'info',
    is_read: false
  });
};

// Mark notification as read
exports.markAsRead = async (notificationId) => {
  const notification = await exports.getNotificationById(notificationId);
  notification.is_read = true;
  return await notification.save();
};

// Mark all as read
exports.markAllAsRead = async (userId) => {
  return await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
};

// Delete notification
exports.deleteNotification = async (notificationId) => {
  const notification = await exports.getNotificationById(notificationId);
  return await notification.destroy();
};

// Get unread count
exports.getUnreadCount = async (userId) => {
  return await Notification.count({
    where: { user_id: userId, is_read: false }
  });
};
