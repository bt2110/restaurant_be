/** Menu Category Controller - HTTP handlers for categories */

const db = require('../models');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { categoryService } = require('../services');
const ridUtil = require('../utils/ridUtil');
const MenuCategory = db.MenuCategory;

// Create category
exports.createCategory = async (req, res) => {
  const correlationId = req.correlationId;
  const { category_name, category_image, branch_id } = req.body;

  try {
    const newCategory = await MenuCategory.create({
      rid: ridUtil.generateRid('cat'),
      category_name,
      category_image,
      branch_id,
      is_delete: false
    });

    return res.status(201).json(responseUtil.success(req,
      'Tạo danh mục thành công',
      newCategory,
      201
    ));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json(responseUtil.conflict(req,
        'RID danh mục đã tồn tại'
      ));
    }
    logger.error('Create category failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi tạo danh mục'
    ));
  }
};

// Get all categories by branch
exports.getAllCategories = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id } = req.query;

  if (!branch_id) {
    return res.status(400).json(responseUtil.validationError(req,
      'Branch ID là bắt buộc',
      { branch_id: 'Branch ID không được để trống' }
    ));
  }

  try {
    const categories = await MenuCategory.findAll({
      where: { branch_id: branch_id, is_delete: false },
      include: [{
        model: db.MenuItem,
        attributes: ['item_id', 'item_name', 'price'],
        where: { is_disable: false },
        required: false
      }],
      order: [['category_id', 'ASC']]
    });

    logger.info('Menu categories retrieved successfully', {
      correlationId,
      context: { branch_id, count: categories.length }
    });

    return res.json(responseUtil.success(req,
      `Lấy danh sách ${categories.length} danh mục thành công`,
      categories
    ));
  } catch (error) {
    logger.error('Get categories by branch failed', {
      correlationId,
      context: { branch_id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy danh sách danh mục'
    ));
  }
};

// ============================================================================
// GET CATEGORY DETAIL
// ============================================================================

// GET CATEGORY DETAIL
// ============================================================================

// Get single category details
exports.getCategoryDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Fetching category detail', {
      correlationId,
      context: { categoryId: id }
    });

    const category = await MenuCategory.findOne({
      where: { category_id: id, is_delete: false },
      include: [{
        model: db.MenuItem,
        where: { is_delete: false },
        required: false
      }]
    });

    if (!category) {
      logger.warn('Category not found', {
        correlationId,
        context: { categoryId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy danh mục hoặc danh mục đã bị xóa'
      ));
    }

    logger.info('Category detail retrieved successfully', {
      correlationId,
      context: { categoryId: id, category_name: category.category_name }
    });

    return res.json(responseUtil.success(req,
      'Lấy thông tin danh mục thành công',
      category
    ));
  } catch (error) {
    logger.error('Get category detail failed', {
      correlationId,
      context: { categoryId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy thông tin danh mục'
    ));
  }
};

// ============================================================================
// UPDATE CATEGORY
// ============================================================================

// Update category information
exports.updateCategory = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { category_name, category_image } = req.body;

  try {
    logger.debug('Updating category', {
      correlationId,
      context: { categoryId: id, updatedFields: { category_name, category_image } }
    });

    const [updatedRows] = await MenuCategory.update(
      { category_name, category_image },
      { where: { category_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      logger.warn('Update category not found', {
        correlationId,
        context: { categoryId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy danh mục hoặc danh mục đã bị xóa'
      ));
    }

    const updatedCategory = await MenuCategory.findByPk(id);

    logger.info('Category updated successfully', {
      correlationId,
      context: { categoryId: id, category_name: updatedCategory.category_name }
    });

    return res.json(responseUtil.success(req,
      'Cập nhật danh mục thành công',
      updatedCategory
    ));
  } catch (error) {
    logger.error('Update category failed', {
      correlationId,
      context: { categoryId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi cập nhật danh mục'
    ));
  }
};

// ============================================================================
// DELETE CATEGORY (SOFT DELETE)
// ============================================================================

// Delete category (soft delete)
exports.deleteCategory = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Deleting category (soft delete)', {
      correlationId,
      context: { categoryId: id }
    });

    const [updatedRows] = await MenuCategory.update(
      { is_delete: true },
      { where: { category_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      logger.warn('Delete category not found', {
        correlationId,
        context: { categoryId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy danh mục hoặc danh mục đã bị xóa'
      ));
    }

    logger.info('Category deleted successfully (soft delete)', {
      correlationId,
      context: { categoryId: id }
    });

    return res.json(responseUtil.success(req,
      'Xóa danh mục thành công (Soft Delete - dữ liệu được giữ lại)'
    ));
  } catch (error) {
    logger.error('Delete category failed', {
      correlationId,
      context: { categoryId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi xóa danh mục'
    ));
  }
};
