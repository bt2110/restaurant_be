// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isStaffOrAbove } = require('../middleware/auth');

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['table_id', 'branch_id']
 *             properties:
 *               table_id:
 *                 type: integer
 *                 example: 1
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               notes:
 *                 type: string
 *                 example: 'Không ớt'
 *     responses:
 *       201:
 *         description: Đơn hàng được tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Lấy danh sách đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: table_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['pending', 'confirmed', 'completed', 'cancelled']
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', verifyToken, isStaffOrAbove, orderController.createOrder);
router.get('/', verifyToken, orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
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
 *             required: ['status']
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['pending', 'confirmed', 'completed', 'cancelled']
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đơn hàng được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đơn hàng được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', verifyToken, orderController.getOrderDetail);
router.put('/:id', verifyToken, isStaffOrAbove, orderController.updateOrderStatus);
router.delete('/:id', verifyToken, isStaffOrAbove, orderController.deleteOrder);

/**
 * @swagger
 * /api/orders/{order_id}/items:
 *   post:
 *     summary: Thêm mục vào đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['item_id', 'quantity']
 *             properties:
 *               item_id:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               notes:
 *                 type: string
 *                 example: 'Thêm chanh'
 *     responses:
 *       200:
 *         description: Mục được thêm vào đơn hàng
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:order_id/items', verifyToken, isStaffOrAbove, orderController.addItemToOrder);

module.exports = router;