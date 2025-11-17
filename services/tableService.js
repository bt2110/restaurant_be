/** Table Service - Table management operations
 * getAllTables, getTableById, createTable, updateTable, deleteTable
 */

const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const { Table, Branch } = db;

// Get all tables
exports.getAllTables = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { is_delete: false };

  if (filters.branch_id) where.branch_id = filters.branch_id;

  const { count, rows } = await Table.findAndCountAll({
    where,
    include: [{ model: Branch, attributes: ['branch_id', 'branch_name'] }],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { tables: rows, total: count, page, limit };
};

// Get table by ID
exports.getTableById = async (tableId) => {
  const table = await Table.findOne({
    where: { table_id: tableId, is_delete: false },
    include: [{ model: Branch, attributes: ['branch_id', 'branch_name'] }]
  });

  if (!table) throw new Error('Table not found');
  return table;
};

// Create table
exports.createTable = async (data) => {
  const { table_name, branch_id, description } = data;

  if (!table_name || !branch_id) {
    throw new Error('table_name and branch_id are required');
  }

  return await Table.create({
    rid: ridUtil.generateRid('tbl'),
    table_name,
    branch_id,
    description: description || '',
    is_delete: false
  });
};

// Update table
exports.updateTable = async (tableId, data) => {
  const table = await exports.getTableById(tableId);
  return await table.update(data);
};

// Delete table (soft delete)
exports.deleteTable = async (tableId) => {
  const table = await exports.getTableById(tableId);
  table.is_delete = true;
  return await table.save();
};
