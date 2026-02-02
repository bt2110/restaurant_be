// models/branch.js
module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    branch_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rid: {
      type: DataTypes.STRING(32),
      unique: true,
    },
    branch_name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    branch_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'branches', // Tên bảng trong DB
    timestamps: false, // Không sử dụng cột createdAt, updatedAt mặc định
  });

  // 3.3 Thiết lập Quan hệ (Associations)
  Branch.associate = (models) => {
    // Quan hệ 1-n: Branch có nhiều Tables
    Branch.hasMany(models.Table, {
      foreignKey: 'branch_id',
      onDelete: 'RESTRICT',
    });
    
    // Quan hệ 1-n: Branch có nhiều Menu Categories
    Branch.hasMany(models.MenuCategory, {
      foreignKey: 'branch_id',
      onDelete: 'CASCADE',
    });
    
    // Quan hệ 1-n: Branch có nhiều Menu Items
    Branch.hasMany(models.MenuItem, {
      foreignKey: 'branch_id',
      onDelete: 'CASCADE',
    });
    
    // Quan hệ 1-n: Branch có nhiều Notifications
    Branch.hasMany(models.Notification, {
      foreignKey: 'branch_id',
      onDelete: 'CASCADE',
    });
    
    // Quan hệ n-n: Branch với User qua UserBranch (sẽ định nghĩa sau)
    Branch.belongsToMany(models.User, {
      through: 'userbranch', // Tên bảng trung gian
      foreignKey: 'branch_id',
      otherKey: 'user_id',
    });
  };

  return Branch;
};