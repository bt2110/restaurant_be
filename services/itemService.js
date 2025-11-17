/** Menu Item Service - Item management operations
 * getAllItems, getItemById, createItem, updateItem, updatePrice, toggleAvailability, deleteItem
 * getItemsByCategory
 */

const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const { MenuItem, MenuCategory, Branch } = db;

// Get all items
exports.getAllItems = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { is_disable: false };

  if (filters.category_id) where.category_id = filters.category_id;
  if (filters.branch_id) where.branch_id = filters.branch_id;

  const { count, rows } = await MenuItem.findAndCountAll({
    where,
    include: [
      { model: MenuCategory, attributes: ['category_id', 'category_name'] },
      { model: Branch, attributes: ['branch_id', 'branch_name'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { items: rows, total: count, page, limit };
};

// Get item by ID
exports.getItemById = async (itemId) => {
  const item = await MenuItem.findOne({
    where: { item_id: itemId, is_disable: false },
    include: [
      { model: MenuCategory, attributes: ['category_id', 'category_name'] },
      { model: Branch, attributes: ['branch_id', 'branch_name'] }
    ]
  });

  if (!item) throw new Error('Menu item not found');
  return item;
};

// Create item
exports.createItem = async (data) => {
  const { item_name, category_id, branch_id, price, item_description, item_image } = data;

  if (!item_name || !category_id || !branch_id) {
    throw new Error('item_name, category_id, and branch_id are required');
  }

  return await MenuItem.create({
    rid: ridUtil.generateRid('itm'),
    item_name,
    category_id,
    branch_id,
    price: price || 0,
    item_description: item_description || '',
    item_image: item_image || null,
    is_disable: false
  });
};

// Update item
exports.updateItem = async (itemId, data) => {
  const item = await exports.getItemById(itemId);
  return await item.update(data);
};

// Update price
exports.updatePrice = async (itemId, price) => {
  const item = await exports.getItemById(itemId);
  item.price = price;
  return await item.save();
};

// Enable/Disable item
exports.toggleAvailability = async (itemId, isDisable) => {
  const item = await exports.getItemById(itemId);
  item.is_disable = isDisable;
  return await item.save();
};

// Delete item (soft delete)
exports.deleteItem = async (itemId) => {
  const item = await exports.getItemById(itemId);
  item.is_disable = true;
  return await item.save();
};

// Get items by category
exports.getItemsByCategory = async (categoryId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await MenuItem.findAndCountAll({
    where: { category_id: categoryId, is_disable: false },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { items: rows, total: count, page, limit };
};
