#!/usr/bin/env node
/**
 * Database Initialize Script
 * Khởi tạo database với schema và dữ liệu ban đầu
 * Usage: node scripts/database/init.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../models');
const ridUtil = require('../utils/ridUtil');

async function initializeDatabase() {
  try {
    const { sequelize, Role, User } = db;

    // By default run safe sync (apply changes). To fully reset use RESET_DB=true
    if (process.env.RESET_DB === 'true') {
      console.log('⚠️ RESET_DB=true - Dropping and recreating database schema');
      await sequelize.drop();
      await sequelize.sync();
    } else {
      console.log('🔄 Syncing database schema (safe)');
      await sequelize.sync({ alter: true });
    }

    // Initialize roles
    const roles = [
      {
        role_name: 'admin',
        description: 'Admin - Full system access',
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
      // create if not exists
      await Role.findOrCreate({ where: { role_name: roleData.role_name }, defaults: roleData });
    }

    // Initialize RID counters
    await ridUtil.initializeCounters();

    // Create default admin account if not exists
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const [adminUser, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        rid: ridUtil.generateRid('usr'),
        user_name: 'Administrator',
        email: adminEmail,
        password: await (async () => { const s = await bcrypt.genSalt(10); return await bcrypt.hash(adminDefaultPassword, s); })(),
        role_id: 1,
        is_active: true
      }
    });

    if (created) {
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️ Admin user already exists:', adminEmail);
    }

    console.log('✅ Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
