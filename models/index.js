// models/index.js 
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database').development;

const sequelize = new Sequelize(dbConfig);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- Định nghĩa Models ---
db.Role = require('./role')(sequelize, Sequelize.DataTypes);
db.Branch = require('./branch')(sequelize, Sequelize.DataTypes);
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.UserBranch = require('./userbranch')(sequelize, Sequelize.DataTypes);
db.Table = require('./table')(sequelize, Sequelize.DataTypes);
db.MenuCategory = require('./menu_category')(sequelize, Sequelize.DataTypes);
db.MenuItem = require('./menu_item')(sequelize, Sequelize.DataTypes);
db.Order = require('./order')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./order_item')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notification')(sequelize, Sequelize.DataTypes);
db.PasswordResetToken = require('./password_reset_token')(sequelize, Sequelize.DataTypes);
db.EmailVerificationToken = require('./email_verification_token')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./audit_log')(sequelize, Sequelize.DataTypes);

// --- Thiết lập Quan hệ (Associations) ---
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;