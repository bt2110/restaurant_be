// models/order_item.js
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    order_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    note: { type: DataTypes.STRING(255) },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
    date_create: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'order_items', timestamps: false });

  OrderItem.associate = (models) => {
    // Quan hệ N-1: OrderItem thuộc về một Order
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      onDelete: 'CASCADE'
    });

    // Quan hệ N-1: OrderItem tham chiếu đến một MenuItem
    OrderItem.belongsTo(models.MenuItem, {
      foreignKey: 'item_id',
      onDelete: 'RESTRICT'
    });
  };

  return OrderItem;
};