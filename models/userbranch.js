// models/userbranch.js
module.exports = (sequelize, DataTypes) => {
  const UserBranch = sequelize.define('UserBranch', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
    branch_id: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'userbranch', timestamps: false });

  return UserBranch;
};