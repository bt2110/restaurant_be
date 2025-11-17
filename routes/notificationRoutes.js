// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, isStaffOrAbove } = require('../middleware/auth');

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Tạo thông báo mới
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['message', 'branch_id', 'type']
 *             properties:
 *               message:
 *                 type: string
 *                 example: 'Đơn hàng bàn 5 đã sẵn sàng'
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               type:
 *                 type: string
 *                 enum: ['order', 'table', 'system']
 *                 example: 'order'
 *               related_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Thông báo được tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Lấy danh sách thông báo theo chi nhánh
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status_admin
 *         schema:
 *           type: string
 *           enum: ['unread', 'read']
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', verifyToken, isStaffOrAbove, notificationController.createNotification);
router.get('/', verifyToken, notificationController.getNotificationsByBranch);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Cập nhật trạng thái thông báo
 *     tags: [Notifications]
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
 *             required: ['status_admin']
 *             properties:
 *               status_admin:
 *                 type: string
 *                 enum: ['unread', 'read']
 *     responses:
 *       200:
 *         description: Thông báo được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', verifyToken, isStaffOrAbove, notificationController.updateNotificationStatus);

module.exports = router;