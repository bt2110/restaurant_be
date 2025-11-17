/** Order Controller - Order management HTTP handling
 * Delegates business logic to orderService
 */

const logger = require('../middleware/logger');
const responseUtil = require('../utils/responseUtil');
const validationUtil = require('../utils/validationUtil');
const { orderService } = require('../services');
const db = require('../models');

// Create order - Create order with items
exports.createOrder = async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.user?.user_id;
  const { table_id, branch_id, notes, order_items } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['order_items']);
  if (!validation.isValid || !order_items || order_items.length === 0) {
    return res.status(400).json(responseUtil.validationError(req, 'order_items array is required'));
  }

  try {
    const order = await orderService.createOrder(userId, { table_id, branch_id, notes });

    for (const item of order_items) {
      await orderService.addOrderItem(order.order_id, item.item_id, item.quantity);
    }

    const fullOrder = await orderService.getOrderById(order.order_id);

    logger.info('Order created', { correlationId, context: { orderId: order.order_id } });

    return res.status(201).json(responseUtil.success(req, 'Order created successfully', fullOrder, 201));
  } catch (error) {
    logger.error('Create order failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error creating order'));
  }
};

// Get order detail - Fetch order with items
exports.getOrderDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const order = await orderService.getOrderById(parseInt(id));

    logger.info('Order retrieved', { correlationId, context: { orderId: id } });

    return res.json(responseUtil.success(req, 'Order retrieved successfully', order));
  } catch (error) {
    logger.warn('Order not found', { correlationId, context: { orderId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'Order not found'));
  }
};

// Get all orders - List orders with filters & pagination
exports.getAllOrders = async (req, res) => {
  const correlationId = req.correlationId;
  const { page = 1, limit = 10, status, branch_id } = req.query;

  try {
    const filters = {};
    if (status) filters.status = status;
    if (branch_id) filters.branch_id = branch_id;

    const result = await orderService.getAllOrders(parseInt(page), parseInt(limit), filters);

    logger.info('Orders retrieved', { correlationId, context: { count: result.total } });

    return res.json(responseUtil.success(req, `Retrieved ${result.total} orders`, result));
  } catch (error) {
    logger.error('Get all orders failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error retrieving orders'));
  }
};

// Update order status - Change order status
exports.updateOrderStatus = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.user_id;

  if (!status) {
    return res.status(400).json(responseUtil.validationError(req, 'status is required'));
  }

  try {
    const order = await orderService.updateOrderStatus(parseInt(id), status, { userId });

    logger.info('Order status updated', { correlationId, context: { orderId: id, newStatus: status } });

    return res.json(responseUtil.success(req, 'Order status updated successfully', order));
  } catch (error) {
    logger.warn('Update order status failed', { correlationId, context: { orderId: id }, error });
    return res.status(400).json(responseUtil.validationError(req, error.message || 'Error updating order'));
  }
};

// Delete order - Cancel/soft delete order
exports.deleteOrder = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    await orderService.cancelOrder(parseInt(id));

    logger.info('Order cancelled', { correlationId, context: { orderId: id } });

    return res.json(responseUtil.success(req, 'Order cancelled successfully'));
  } catch (error) {
    logger.warn('Delete order failed', { correlationId, context: { orderId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'Order not found'));
  }
};

// Add item to order - Add menu item to order
exports.addItemToOrder = async (req, res) => {
  const correlationId = req.correlationId;
  const { order_id, item_id, quantity } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['order_id', 'item_id', 'quantity']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'order_id, item_id, quantity required'));
  }

  try {
    const orderItem = await orderService.addOrderItem(parseInt(order_id), parseInt(item_id), parseInt(quantity));

    logger.info('Item added to order', { correlationId, context: { orderId: order_id, itemId: item_id } });

    return res.json(responseUtil.success(req, 'Item added to order successfully', orderItem));
  } catch (error) {
    logger.warn('Add item to order failed', { correlationId, error });
    return res.status(404).json(responseUtil.notFound(req, error.message || 'Order or item not found'));
  }
};
// Get order detail - Fetch order with items
exports.getOrderDetail = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const order = await orderService.getOrderById(parseInt(id));

    logger.info('Order retrieved', { correlationId, context: { orderId: id } });

    return res.json(responseUtil.success(req, 'Order retrieved successfully', order));
  } catch (error) {
    logger.warn('Order not found', { correlationId, context: { orderId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'Order not found'));
  }
};

// Get all orders - List orders with filters & pagination
exports.getAllOrders = async (req, res) => {
  const correlationId = req.correlationId;
  const { page = 1, limit = 10, status, branch_id } = req.query;

  try {
    const filters = {};
    if (status) filters.status = status;
    if (branch_id) filters.branch_id = branch_id;

    const result = await orderService.getAllOrders(parseInt(page), parseInt(limit), filters);

    logger.info('Orders retrieved', { correlationId, context: { count: result.total } });

    return res.json(responseUtil.success(req, `Retrieved ${result.total} orders`, result));
  } catch (error) {
    logger.error('Get all orders failed', { correlationId, error });
    return res.status(500).json(responseUtil.serverError(req, 'Error retrieving orders'));
  }
};

// Update order status - Change order status
exports.updateOrderStatus = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.user_id;

  if (!status) {
    return res.status(400).json(responseUtil.validationError(req, 'status is required'));
  }

  try {
    const order = await orderService.updateOrderStatus(parseInt(id), status, { userId });

    logger.info('Order status updated', { correlationId, context: { orderId: id, newStatus: status } });

    return res.json(responseUtil.success(req, 'Order status updated successfully', order));
  } catch (error) {
    logger.warn('Update order status failed', { correlationId, context: { orderId: id }, error });
    return res.status(400).json(responseUtil.validationError(req, error.message || 'Error updating order'));
  }
};

// Delete order - Cancel/soft delete order
exports.deleteOrder = async (req, res) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    await orderService.cancelOrder(parseInt(id));

    logger.info('Order cancelled', { correlationId, context: { orderId: id } });

    return res.json(responseUtil.success(req, 'Order cancelled successfully'));
  } catch (error) {
    logger.warn('Delete order failed', { correlationId, context: { orderId: id } });
    return res.status(404).json(responseUtil.notFound(req, 'Order not found'));
  }
};

// Add item to order - Add menu item to order
exports.addItemToOrder = async (req, res) => {
  const correlationId = req.correlationId;
  const { order_id, item_id, quantity } = req.body;

  const validation = validationUtil.validateRequiredFields(req.body, ['order_id', 'item_id', 'quantity']);
  if (!validation.isValid) {
    return res.status(400).json(responseUtil.validationError(req, 'order_id, item_id, quantity required'));
  }

  try {
    const orderItem = await orderService.addOrderItem(parseInt(order_id), parseInt(item_id), parseInt(quantity));

    logger.info('Item added to order', { correlationId, context: { orderId: order_id, itemId: item_id } });

    return res.json(responseUtil.success(req, 'Item added to order successfully', orderItem));
  } catch (error) {
    logger.warn('Add item to order failed', { correlationId, error });
    return res.status(404).json(responseUtil.notFound(req, error.message || 'Order or item not found'));
  }
};
