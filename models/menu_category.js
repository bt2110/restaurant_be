// models/menu_category.js
module.exports = (sequelize, DataTypes) => {
  const MenuCategory = sequelize.define('MenuCategory', {
    category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    category_name: { type: DataTypes.STRING(255), allowNull: false },
    category_image: { type: DataTypes.STRING(255) },
    branch_id: { type: DataTypes.INTEGER, allowNull: false },
    is_delete: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'menu_categories', timestamps: false });

  MenuCategory.associate = (models) => {
    // Quan hệ N-1: Category thuộc về một Branch
    MenuCategory.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      onDelete: 'CASCADE'
    });

    // Quan hệ 1-N: Category có nhiều Menu Items
    MenuCategory.hasMany(models.MenuItem, {
      foreignKey: 'category_id',
      onDelete: 'SET NULL'
    });
  };

  return MenuCategory;
};