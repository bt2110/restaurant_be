// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken, isAdminOrManager } = require('../middleware/auth');

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Tạo bàn mới
 *     tags: [Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['table_number', 'branch_id', 'capacity']
 *             properties:
 *               table_number:
 *                 type: string
 *                 example: 'A01'
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               capacity:
 *                 type: integer
 *                 example: 4
 *               status:
 *                 type: string
 *                 enum: ['available', 'occupied', 'reserved']
 *                 default: 'available'
 *     responses:
 *       201:
 *         description: Bàn được tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Lấy danh sách bàn theo chi nhánh
 *     tags: [Tables]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách bàn
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', verifyToken, isAdminOrManager, tableController.createTable);
router.get('/', verifyToken, tableController.getAllTablesByBranch);

/**
 * @swagger
 * /api/tables/{id}:
 *   get:
 *     summary: Lấy chi tiết bàn
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết bàn
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật bàn
 *     tags: [Tables]
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
 *               table_number:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: ['available', 'occupied', 'reserved']
 *     responses:
 *       200:
 *         description: Bàn được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa bàn
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bàn được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', verifyToken, tableController.getTableDetail);
router.put('/:id', verifyToken, isAdminOrManager, tableController.updateTable);
router.delete('/:id', verifyToken, isAdminOrManager, tableController.deleteTable);

module.exports = router;