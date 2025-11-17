// routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isAdminOrManager } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const itemController = require('../controllers/itemController');

// ==================== MENU CATEGORIES ====================

/**
 * @swagger
 * /api/menu/categories:
 *   post:
 *     summary: Tạo danh mục menu mới
 *     tags: [Menu Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['category_name', 'branch_id']
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: 'Khai vị'
 *               description:
 *                 type: string
 *                 example: 'Các món khai vị'
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Danh mục được tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Lấy danh sách danh mục menu
 *     tags: [Menu Categories]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/categories', verifyToken, isAdminOrManager, categoryController.createCategory);
router.get('/categories', verifyToken, categoryController.getAllCategories);

/**
 * @swagger
 * /api/menu/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết danh mục menu
 *     tags: [Menu Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết danh mục
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật danh mục menu
 *     tags: [Menu Categories]
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
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Danh mục được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa danh mục menu
 *     tags: [Menu Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/categories/:id', verifyToken, categoryController.getCategoryDetail);
router.put('/categories/:id', verifyToken, isAdminOrManager, categoryController.updateCategory);
router.delete('/categories/:id', verifyToken, isAdminOrManager, categoryController.deleteCategory);

// ==================== MENU ITEMS ====================

/**
 * @swagger
 * /api/menu/items:
 *   post:
 *     summary: Tạo mục menu mới
 *     tags: [Menu Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['item_name', 'category_id', 'price', 'branch_id']
 *             properties:
 *               item_name:
 *                 type: string
 *                 example: 'Gỏi cuốn'
 *               description:
 *                 type: string
 *                 example: 'Gỏi cuốn tôm'
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 45000
 *               image_url:
 *                 type: string
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Mục menu được tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Lấy danh sách mục menu
 *     tags: [Menu Items]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách mục menu
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/items', verifyToken, isAdminOrManager, itemController.createItem);
router.get('/items', verifyToken, itemController.getAllItems);

/**
 * @swagger
 * /api/menu/items/{id}:
 *   get:
 *     summary: Lấy chi tiết mục menu
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết mục menu
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật mục menu
 *     tags: [Menu Items]
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
 *               item_name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mục menu được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa mục menu
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mục menu được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/items/:id', verifyToken, itemController.getItemDetail);
router.put('/items/:id', verifyToken, isAdminOrManager, itemController.updateItem);
router.delete('/items/:id', verifyToken, isAdminOrManager, itemController.deleteItem);

module.exports = router;