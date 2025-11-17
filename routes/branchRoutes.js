// routes/branchRoutes.js
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Tạo chi nhánh mới
 *     tags: [Branches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['branch_name']
 *             properties:
 *               branch_name:
 *                 type: string
 *                 example: 'Chi nhánh Hà Nội'
 *               description:
 *                 type: string
 *                 example: 'Nhà hàng ở phố Hàng Ngoài'
 *               rid:
 *                 type: string
 *                 example: 'br-custom-id'
 *     responses:
 *       201:
 *         description: Chi nhánh được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Tạo chi nhánh thành công.'
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   get:
 *     summary: Lấy danh sách tất cả chi nhánh
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: Danh sách chi nhánh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', verifyToken, isAdmin, branchController.createBranch);
router.get('/', verifyToken, branchController.getAllBranches);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Lấy chi tiết chi nhánh
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID chi nhánh
 *     responses:
 *       200:
 *         description: Chi tiết chi nhánh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Cập nhật chi nhánh
 *     tags: [Branches]
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
 *               branch_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chi nhánh được cập nhật
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Xóa chi nhánh (soft delete)
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi nhánh được xóa
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', verifyToken, branchController.getBranchDetail);
router.put('/:id', verifyToken, isAdmin, branchController.updateBranch);
router.delete('/:id', verifyToken, isAdmin, branchController.deleteBranch);

module.exports = router;