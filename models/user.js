// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rid: { type: DataTypes.STRING(32), unique: true },
    user_name: { type: DataTypes.STRING(255), allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true },
    role_id: { 
      type: DataTypes.INTEGER,
      defaultValue: 4, // customer by default
      references: {
        model: 'roles',
        key: 'role_id'
      }
    },
    lock_up: { type: DataTypes.BOOLEAN, defaultValue: false },
    last_login: { type: DataTypes.DATE, defaultValue: null },
    login_attempt: { type: DataTypes.INTEGER, defaultValue: 0 },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    email_verified_at: { type: DataTypes.DATE },
    lock_up_at: { type: DataTypes.DATE },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    user_phone: { type: DataTypes.STRING(20) },
    user_address: { type: DataTypes.STRING(500) }
  }, { 
    tableName: 'users', 
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    // Quan hệ N-N với Branch thông qua bảng userbranch
    User.belongsToMany(models.Branch, {
      through: models.UserBranch,
      foreignKey: 'user_id',
      otherKey: 'branch_id',
    });

    // Quan hệ N-1 với Role
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role'
    });
  };

  return User;
};