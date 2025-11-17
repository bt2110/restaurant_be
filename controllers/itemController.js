/** Menu Item Controller - HTTP handlers for menu items */

const db = require('../models');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const { itemService } = require('../services');
const ridUtil = require('../utils/ridUtil');
const MenuItem = db.MenuItem;

// Create item
exports.createItem = async (req, res) => {
  const correlationId = req.correlationId;
  const { item_name, category_id, branch_id, item_description, item_image, price } = req.body;

  try {
    const newItem = await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name,
      category_id,
      branch_id,
      item_description,
      item_image,
      price: price || 0.00,
      is_delete: false
    });

    logger.info('Menu item created successfully', {
      correlationId,
      context: { itemId: newItem.item_id, item_name, category_id, price }
    });

    // ========== RESPONSE ==========
    return res.status(201).json(responseUtil.success(req,
      'Tạo mục menu thành công',
      newItem,
      201
    ));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.warn('Create item duplicate RID', {
        correlationId,
        context: { rid, item_name }
      });
      return res.status(409).json(responseUtil.conflict(req,
        'RID mục menu đã tồn tại'
      ));
    }

    logger.error('Create item failed', {
      correlationId,
      context: { item_name, category_id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi tạo mục menu'
    ));
  }
};

// ============================================================================
// GET ALL ITEMS
// ============================================================================

// Get items filtered by branch/category
exports.getAllItems = async (req, res) => {
  const correlationId = req.correlationId;
  const { branch_id, category_id } = req.query;

  // ========== VALIDATION ==========
  if (!branch_id && !category_id) {
    logger.warn('Get items missing required filters', { correlationId });
    return res.status(400).json(responseUtil.validationError(req,
      'Branch ID hoặc Category ID là bắt buộc',
      { filter: 'Cần ít nhất một trong Branch ID hoặc Category ID' }
    ));
  }

  try {
    logger.debug('Fetching menu items', {
      correlationId,
      context: { branch_id, category_id }
    });

    // ========== BUILD WHERE CLAUSE ==========
    let whereClause = { is_delete: false };

    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    // ========== QUERY ==========
    const items = await MenuItem.findAll({
      where: whereClause,
      include: [
        {
          model: db.MenuCategory,
          attributes: ['category_id', 'category_name']
        },
        {
          model: db.Branch,
          attributes: ['branch_id', 'branch_name']
        }
      ],
      order: [['item_id', 'ASC']]
    });

    logger.info('Menu items retrieved successfully', {
      correlationId,
      context: { branch_id, category_id, count: items.length }
    });

    return res.json(responseUtil.success(req,
      `Lấy danh sách ${items.length} mục menu thành công`,
      items
    ));
  } catch (error) {
    logger.error('Get items failed', {
      correlationId,
      context: { branch_id, category_id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy danh sách mục menu'
    ));
  }
};

// ============================================================================
// GET ITEM DETAIL
// ============================================================================

// Get single item details
exports.getItemDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Fetching item detail', {
      correlationId,
      context: { itemId: id }
    });

    const item = await MenuItem.findOne({
      where: { item_id: id, is_delete: false },
      include: [
        {
          model: db.MenuCategory,
          attributes: ['category_id', 'category_name']
        },
        {
          model: db.Branch,
          attributes: ['branch_id', 'branch_name']
        }
      ]
    });

    if (!item) {
      logger.warn('Item not found', {
        correlationId,
        context: { itemId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy mục menu hoặc mục menu đã bị xóa'
      ));
    }

    logger.info('Item detail retrieved successfully', {
      correlationId,
      context: { itemId: id, item_name: item.item_name }
    });

    return res.json(responseUtil.success(req,
      'Lấy thông tin mục menu thành công',
      item
    ));
  } catch (error) {
    logger.error('Get item detail failed', {
      correlationId,
      context: { itemId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi lấy thông tin mục menu'
    ));
  }
};

// ============================================================================
// UPDATE ITEM
// ============================================================================

// Update item information
exports.updateItem = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { item_name, item_description, item_image, price, is_disable } = req.body;

  try {
    logger.debug('Updating menu item', {
      correlationId,
      context: { itemId: id, updatedFields: { item_name, price, is_disable } }
    });

    const [updatedRows] = await MenuItem.update(
      { item_name, item_description, item_image, price, is_disable },
      { where: { item_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      logger.warn('Update item not found', {
        correlationId,
        context: { itemId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy mục menu hoặc mục menu đã bị xóa'
      ));
    }

    const updatedItem = await MenuItem.findByPk(id);

    logger.info('Menu item updated successfully', {
      correlationId,
      context: { itemId: id, item_name: updatedItem.item_name, price: updatedItem.price }
    });

    return res.json(responseUtil.success(req,
      'Cập nhật mục menu thành công',
      updatedItem
    ));
  } catch (error) {
    logger.error('Update item failed', {
      correlationId,
      context: { itemId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi cập nhật mục menu'
    ));
  }
};

// ============================================================================
// DELETE ITEM (SOFT DELETE)
// ============================================================================

// Delete menu item (soft delete)
exports.deleteItem = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    logger.debug('Deleting menu item (soft delete)', {
      correlationId,
      context: { itemId: id }
    });

    const [updatedRows] = await MenuItem.update(
      { is_delete: true },
      { where: { item_id: id, is_delete: false } }
    );

    if (updatedRows === 0) {
      logger.warn('Delete item not found', {
        correlationId,
        context: { itemId: id }
      });
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy mục menu hoặc mục menu đã bị xóa'
      ));
    }

    logger.info('Menu item deleted successfully (soft delete)', {
      correlationId,
      context: { itemId: id }
    });

    return res.json(responseUtil.success(req,
      'Xóa mục menu thành công (Soft Delete - dữ liệu được giữ lại)'
    ));
  } catch (error) {
    logger.error('Delete item failed', {
      correlationId,
      context: { itemId: id },
      error
    });
    return res.status(500).json(responseUtil.serverError(req,
      'Lỗi server khi xóa mục menu'
    ));
  }
};
