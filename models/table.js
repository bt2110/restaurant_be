// models/table.js
module.exports = (sequelize, DataTypes) => {
  const Table = sequelize.define('Table', {
    table_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    table_name: { type: DataTypes.STRING(60), allowNull: false },
    description: { type: DataTypes.STRING(255) },
    branch_id: { type: DataTypes.INTEGER, allowNull: false }, // Foreign Key
    is_delete: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'tables', timestamps: false });

  Table.associate = (models) => {
    // Quan hệ N-1: Table thuộc về một Branch
    Table.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      onDelete: 'RESTRICT' 
    });

    // Quan hệ 1-N: Table có nhiều Orders
    Table.hasMany(models.Order, {
      foreignKey: 'table_id',
      onDelete: 'RESTRICT' 
    });
  };

  return Table;
};