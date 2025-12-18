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
    
    // Reset database schema
    await sequelize.drop();
    await sequelize.sync();
    
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
      await Role.create(roleData);
    }
    
    // Initialize RID counters
    await ridUtil.initializeCounters();
    
    // Create default admin account
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
      salt
    );
    
    const adminUser = await User.create({
      rid: ridUtil.generateRid('usr'),
      user_name: 'Administrator',
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role_id: 1,
      is_active: true
    });
    
    console.log('✅ Database initialization completed!');
    console.log(`   Admin: admin@restaurant.com`);
    
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
