/** Menu Category Service - Category management operations
 * getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory
 */

const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const { MenuCategory, Branch } = db;

// Get all categories
exports.getAllCategories = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { is_delete: false };

  if (filters.branch_id) where.branch_id = filters.branch_id;

  const { count, rows } = await MenuCategory.findAndCountAll({
    where,
    include: [{ model: Branch, attributes: ['branch_id', 'branch_name'] }],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { categories: rows, total: count, page, limit };
};

// Get category by ID
exports.getCategoryById = async (categoryId) => {
  const category = await MenuCategory.findOne({
    where: { category_id: categoryId, is_delete: false },
    include: [{ model: Branch, attributes: ['branch_id', 'branch_name'] }]
  });

  if (!category) throw new Error('Category not found');
  return category;
};

// Create category
exports.createCategory = async (data) => {
  const { category_name, branch_id, category_image } = data;

  if (!category_name || !branch_id) {
    throw new Error('category_name and branch_id are required');
  }

  return await MenuCategory.create({
    rid: ridUtil.generateRid('cat'),
    category_name,
    branch_id,
    category_image: category_image || null,
    is_delete: false
  });
};

// Update category
exports.updateCategory = async (categoryId, data) => {
  const category = await exports.getCategoryById(categoryId);
  return await category.update(data);
};

// Delete category (soft delete)
exports.deleteCategory = async (categoryId) => {
  const category = await exports.getCategoryById(categoryId);
  category.is_delete = true;
  return await category.save();
};
