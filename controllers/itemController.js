/** Menu Item Controller - HTTP handlers for menu items */

const db = require('../models');
const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const imageUtil = require('../utils/imageUtil');
const ridUtil = require('../utils/ridUtil');
const MenuItem = db.MenuItem;

// Create item
exports.createItem = async (req, res) => {
  const correlationId = req.correlationId;
  const { item_name, category_id, branch_id, item_description, price } = req.body;

  try {
    // Validate foreign keys first to avoid saving orphan images
    if (category_id) {
      const category = await db.MenuCategory.findOne({ where: { category_id, is_delete: false } });
      if (!category) {
        return res.status(400).json(responseUtil.validationError(req,
          'Category không tồn tại', { category_id }
        ));
      }
    }
    if (branch_id) {
      const branch = await db.Branch.findOne({ where: { branch_id, is_delete: false } });
      if (!branch) {
        return res.status(400).json(responseUtil.validationError(req,
          'Branch không tồn tại', { branch_id }
        ));
      }
    }

    // Create item without image first
    const payload = {
      rid: ridUtil.generateRid('itm'),
      item_name,
      category_id,
      branch_id,
      item_description,
      item_image: null,
      price: price || 0.00,
      is_delete: false
    };

    const newItem = await MenuItem.create(payload);

    // If an image file was provided, validate and attach after creating the DB row
    if (req.file) {
      const validation = imageUtil.validateImageFile(req.file.buffer, req.file.originalname);
      if (!validation.isValid) {
        // Delete created DB row to avoid dangling entries
        await MenuItem.destroy({ where: { item_id: newItem.item_id } });
        return res.status(400).json(responseUtil.validationError(req,
          validation.error,
          { file: validation.error }
        ));
      }

      try {
        const imagePath = imageUtil.saveItemImage(req.file.buffer, newItem.item_id);
        const [updated] = await MenuItem.update({ item_image: imagePath }, { where: { item_id: newItem.item_id } });
        if (updated === 0) {
          // rollback image file
          imageUtil.deleteImage(imagePath);
        }
      } catch (e) {
        // If saving image fails, delete created DB record to avoid partial state
        try { await MenuItem.destroy({ where: { item_id: newItem.item_id } }); } catch (e2) { /* ignore */ }
        logger.error('Failed to save item image after creating item', { correlationId, error: e });
        return res.status(500).json(responseUtil.serverError(req, 'Lỗi khi lưu ảnh mục menu'));
      }
    }

    const created = await MenuItem.findByPk(newItem.item_id);
    imageUtil.attachFullUrls(created, req);

    logger.info('Menu item created successfully', {
      correlationId,
      context: { itemId: created.item_id, item_name, category_id, price }
    });

    return res.status(201).json(responseUtil.success(req,
      'Tạo mục menu thành công',
      created,
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
    // attach full urls for images
    imageUtil.attachFullUrls(items, req);

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

    imageUtil.attachFullUrls(item, req);

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
  const { item_name, item_description, price, is_disable } = req.body;

  try {
    const item = await MenuItem.findOne({ where: { item_id: id, is_delete: false } });
    if (!item) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy mục menu hoặc mục menu đã bị xóa'
      ));
    }

    // Image update must use multipart/form-data (req.file) or use /:id/image endpoint
    let imagePath;
    if (req.file) {
      const imageUtil = require('../utils/imageUtil');
      const validation = imageUtil.validateImageFile(req.file.buffer, req.file.originalname);
      if (!validation.isValid) {
        return res.status(400).json(responseUtil.validationError(req,
          validation.error,
          { file: validation.error }
        ));
      }
      imagePath = imageUtil.updateItemImage(req.file.buffer, id, item.item_image);
    }

    const updatePayload = { item_name, item_description, price, is_disable };
    if (imagePath) updatePayload.item_image = imagePath;

    const [updatedRows] = await MenuItem.update(updatePayload, { where: { item_id: id, is_delete: false } });

    if (updatedRows === 0) {
      return res.status(404).json(responseUtil.notFound(req,
        'Không tìm thấy mục menu hoặc mục menu đã bị xóa'
      ));
    }

    const updatedItem = await MenuItem.findByPk(id);
    imageUtil.attachFullUrls(updatedItem, req);

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

// Upload item image
exports.uploadItemImage = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  try {
    const item = await MenuItem.findOne({ where: { item_id: id, is_delete: false } });
    if (!item) {
      return res.status(404).json(responseUtil.notFound(req, 'Không tìm thấy mục menu hoặc mục menu đã bị xóa'));
    }

    if (!req.file) {
      return res.status(400).json(responseUtil.validationError(req, 'Vui lòng cung cấp tệp ảnh', { file: 'Tệp ảnh là bắt buộc' }));
    }

    const imageUtil = require('../utils/imageUtil');
    const validation = imageUtil.validateImageFile(req.file.buffer, req.file.originalname);
    if (!validation.isValid) {
      return res.status(400).json(responseUtil.validationError(req, validation.error, { file: validation.error }));
    }

    const imagePath = imageUtil.updateItemImage(req.file.buffer, id, item.item_image);

    const [updatedRows] = await MenuItem.update({ item_image: imagePath }, { where: { item_id: id } });
    if (updatedRows === 0) {
      imageUtil.deleteImage(imagePath);
      return res.status(500).json(responseUtil.serverError(req, 'Không thể lưu thông tin ảnh'));
    }

    const updatedItem = await MenuItem.findByPk(id);
    imageUtil.attachFullUrls(updatedItem, req);
    return res.json(responseUtil.success(req, 'Tải lên ảnh mục menu thành công', updatedItem));
  } catch (error) {
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi tải lên ảnh mục menu'));
  }
};

// Delete item image
exports.deleteItemImageHandler = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  try {
    const item = await MenuItem.findOne({ where: { item_id: id, is_delete: false } });
    if (!item) {
      return res.status(404).json(responseUtil.notFound(req, 'Không tìm thấy mục menu hoặc mục menu đã bị xóa'));
    }
    if (!item.item_image) {
      return res.status(400).json(responseUtil.badRequest(req, 'Mục menu không có ảnh để xóa'));
    }

    const imageUtil = require('../utils/imageUtil');
    imageUtil.deleteImage(item.item_image);
    await MenuItem.update({ item_image: null }, { where: { item_id: id } });
    const updatedItem = await MenuItem.findByPk(id);
    imageUtil.attachFullUrls(updatedItem, req);
    return res.json(responseUtil.success(req, 'Xóa ảnh mục menu thành công', updatedItem));
  } catch (error) {
    return res.status(500).json(responseUtil.serverError(req, 'Lỗi server khi xóa ảnh mục menu'));
  }
};
