// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdminOrManager } = require('../middleware/auth');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', verifyToken, userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng
 *     tags: [Users]
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
 *         description: Chi tiết người dùng
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật người dùng
 *     tags: [Users]
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
 *               user_name:
 *                 type: string
 *               user_email:
 *                 type: string
 *               user_phone:
 *                 type: string
 *               user_avatar:
 *                 type: string
 *               user_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Người dùng được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa người dùng
 *     tags: [Users]
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
 *         description: Người dùng được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', verifyToken, userController.getUserDetail);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, isAdminOrManager, userController.deleteUser);

/**
 * @swagger
 * /api/users/branch/users:
 *   get:
 *     summary: Lấy người dùng theo chi nhánh
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách người dùng của chi nhánh
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/branch/users', verifyToken, userController.getUsersByBranch);

/**
 * @swagger
 * /api/users/assign-branch:
 *   post:
 *     summary: Gán người dùng vào chi nhánh
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['uid', 'bid']
 *             properties:
 *               uid:
 *                 type: integer
 *               bid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Người dùng được gán vào chi nhánh
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/assign-branch', verifyToken, isAdminOrManager, userController.assignUserToBranch);

/**
 * @swagger
 * /api/users/remove-branch:
 *   delete:
 *     summary: Xóa người dùng khỏi chi nhánh
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['uid', 'bid']
 *             properties:
 *               uid:
 *                 type: integer
 *               bid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Người dùng được xóa khỏi chi nhánh
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.delete('/remove-branch', verifyToken, isAdminOrManager, userController.removeUserFromBranch);

/**
 * @swagger
 * /api/users/assign-role:
 *   post:
 *     summary: Cấp quyền/Role cho người dùng (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['user_id', 'role_id']
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 5
 *               role_id:
 *                 type: integer
 *                 example: 2
 *                 description: '1=Admin, 2=Manager, 3=Staff, 4=Customer'
 *     responses:
 *       200:
 *         description: Role đã được cấp thành công
 *       403:
 *         description: Chỉ admin mới có thể cấp role
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/assign-role', verifyToken, userController.assignRole);

module.exports = router;