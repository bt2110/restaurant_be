/**
 * Reset Database Script
 * Truncates all data and re-initializes with admin account and roles
 */

require('dotenv').config();
const db = require('../models');

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    const { sequelize, Role, User } = db;
    
    // Drop all tables and recreate schema
    console.log('📊 Resetting database schema...');
    await sequelize.drop();
    await sequelize.sync();
    
    // Initialize roles
    console.log('👥 Initializing roles...');
    const roles = [
      {
        role_name: 'admin',
        description: 'Admin - Full control',
        permissions: {
          manage_roles: true,
          manage_users: true,
          manage_branches: true,
          manage_tables: true,
          manage_menu: true,
          view_analytics: true,
          read_order: true,
          create_order: true,
          update_order: true,
          delete_order: true
        },
        is_active: true
      },
      {
        role_name: 'manager',
        description: 'Manager - Branch management',
        permissions: {
          manage_users: false,
          manage_branches: false,
          manage_tables: true,
          manage_menu: true,
          view_analytics: true,
          read_order: true,
          create_order: true,
          update_order: true,
          delete_order: true
        },
        is_active: true
      },
      {
        role_name: 'staff',
        description: 'Staff - Order processing',
        permissions: {
          manage_users: false,
          manage_branches: false,
          manage_tables: false,
          manage_menu: false,
          view_analytics: false,
          read_order: true,
          create_order: true,
          update_order: true,
          delete_order: false
        },
        is_active: true
      },
      {
        role_name: 'customer',
        description: 'Customer - View only',
        permissions: {
          manage_users: false,
          manage_branches: false,
          manage_tables: false,
          manage_menu: false,
          view_analytics: false,
          read_order: false,
          create_order: false,
          update_order: false,
          delete_order: false
        },
        is_active: true
      }
    ];
    
    for (const roleData of roles) {
      await Role.create(roleData);
      console.log(`  ✅ Created role: ${roleData.role_name}`);
    }
    
    // Create default admin account via User model directly (bypass authService validation)
    console.log('🔑 Creating default admin account...');
    const bcrypt = require('bcryptjs');
    const ridUtil = require('../utils/ridUtil');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456', salt);
    
    const adminUser = await User.create({
      rid: ridUtil.generateRid('usr'),
      user_name: 'Administrator',
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role_id: 1, // admin
      is_active: true
    });
    
    console.log(`  ✅ Created admin account: ${adminUser.email}`);
    
    console.log('\n✨ Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

resetDatabase();
