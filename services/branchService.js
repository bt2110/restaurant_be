/** Branch Service - Branch management operations
 * getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch
 */

const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const { Branch } = db;

// Get all branches
exports.getAllBranches = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { is_delete: false };

  const { count, rows } = await Branch.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { branches: rows, total: count, page, limit };
};

// Get branch by ID
exports.getBranchById = async (branchId) => {
  const branch = await Branch.findOne({
    where: { branch_id: branchId, is_delete: false }
  });

  if (!branch) throw new Error('Branch not found');
  return branch;
};

// Create branch
exports.createBranch = async (data) => {
  const { branch_name, description } = data;

  if (!branch_name) throw new Error('branch_name is required');

  return await Branch.create({
    rid: ridUtil.generateRid('br'),
    branch_name,
    description: description || '',
    is_delete: false
  });
};

// Update branch
exports.updateBranch = async (branchId, data) => {
  const branch = await exports.getBranchById(branchId);
  return await branch.update(data);
};

// Delete branch (soft delete)
exports.deleteBranch = async (branchId) => {
  const branch = await exports.getBranchById(branchId);
  branch.is_delete = true;
  return await branch.save();
};
