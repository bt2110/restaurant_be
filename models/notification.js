// models/notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    order_id: { type: DataTypes.INTEGER, allowNull: true }, // Có thể là NULL
    branch_id: { type: DataTypes.INTEGER, allowNull: false },
    sent_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status_admin: { type: DataTypes.SMALLINT, defaultValue: 0 },
    status_client: { type: DataTypes.SMALLINT, defaultValue: 0 }
  }, { tableName: 'notifications', timestamps: false });

  Notification.associate = (models) => {
    // Quan hệ N-1: Notification thuộc về một Order (hoặc NULL)
    Notification.belongsTo(models.Order, {
      foreignKey: 'order_id',
      onDelete: 'SET NULL'
    });

    // Quan hệ N-1: Notification thuộc về một Branch
    Notification.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      onDelete: 'CASCADE'
    });
  };

  return Notification;
};