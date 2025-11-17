// models/order.js
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    table_id: { type: DataTypes.INTEGER, allowNull: false },
    order_status: { type: DataTypes.STRING(50) },
    order_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    order_message: { type: DataTypes.TEXT },
    order_note: { type: DataTypes.TEXT }
  }, { tableName: 'orders', timestamps: false });

  Order.associate = (models) => {
    // Quan hệ N-1: Order thuộc về một Table
    Order.belongsTo(models.Table, {
      foreignKey: 'table_id',
      onDelete: 'RESTRICT'
    });

    // Quan hệ 1-N: Order có nhiều Order Items
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      onDelete: 'CASCADE'
    });

    // Quan hệ 1-N: Order có thể có nhiều Notifications
    Order.hasMany(models.Notification, {
      foreignKey: 'order_id',
      onDelete: 'SET NULL' 
    });
  };

  return Order;
};