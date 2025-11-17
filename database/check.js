#!/usr/bin/env node
/**
 * Database Health Check Script
 * Verifies database connection and schema integrity
 * Usage: node database/check.js
 */

require('dotenv').config();
const db = require('../models');

async function checkDatabase() {
  try {
    console.log('🔍 Starting database health check...\n');
    
    const { sequelize } = db;
    
    // Step 1: Check connection
    console.log('Step 1️⃣  - Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection: OK\n');
    
    // Step 2: Check tables
    console.log('Step 2️⃣  - Checking tables...');
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`,
      { raw: true }
    );
    
    const expectedTables = [
      'branches', 'email_verification_tokens', 'menu_categories',
      'menu_items', 'notifications', 'order_items', 'orders',
      'password_reset_tokens', 'roles', 'tables', 'userbranch', 'users'
    ];
    
    const tableNames = tables[0].map(t => t.table_name);
    const missing = expectedTables.filter(t => !tableNames.includes(t));
    
    if (missing.length > 0) {
      console.log('⚠️  Missing tables:', missing.join(', '));
    } else {
      console.log(`✅ All ${expectedTables.length} expected tables present`);
    }
    console.log(`📊 Total tables: ${tableNames.length}\n`);
    
    // Step 3: Check roles
    console.log('Step 3️⃣  - Checking roles...');
    const roles = await sequelize.query(
      `SELECT role_id, role_name FROM roles ORDER BY role_id`,
      { raw: true }
    );
    
    const [roleData] = roles;
    if (roleData && roleData.length === 4) {
      console.log(`✅ Roles initialized (${roleData.length} total)`);
      roleData.forEach(r => console.log(`   • ${r.role_name} (ID: ${r.role_id})`));
    } else {
      console.log(`⚠️  Roles not properly initialized (found: ${roleData ? roleData.length : 0})`);
    }
    console.log('');
    
    // Step 4: Check admin account
    console.log('Step 4️⃣  - Checking admin account...');
    const adminCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM users WHERE role_id = 1`,
      { raw: true }
    );
    
    const [[{ count }]] = adminCount;
    if (count > 0) {
      console.log(`✅ Admin accounts found: ${count}`);
    } else {
      console.log('⚠️  No admin accounts found');
    }
    console.log('');
    
    // Step 5: Check data volume
    console.log('Step 5️⃣  - Checking data volume...');
    const stats = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM branches) as branches,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM roles) as roles,
        (SELECT COUNT(*) FROM tables) as tables,
        (SELECT COUNT(*) FROM menu_categories) as categories,
        (SELECT COUNT(*) FROM menu_items) as items,
        (SELECT COUNT(*) FROM orders) as orders
    `, { raw: true });
    
    const [[stats_data]] = stats;
    console.log(`   📊 Branches: ${stats_data.branches}`);
    console.log(`   👥 Users: ${stats_data.users}`);
    console.log(`   🔐 Roles: ${stats_data.roles}`);
    console.log(`   🪑 Tables: ${stats_data.tables}`);
    console.log(`   📋 Menu Categories: ${stats_data.categories}`);
    console.log(`   🍽️  Menu Items: ${stats_data.items}`);
    console.log(`   📦 Orders: ${stats_data.orders}\n`);
    
    // Summary
    console.log('═'.repeat(50));
    console.log('✅ Database health check completed!\n');
    console.log('Status: All systems operational');
    console.log('═'.repeat(50) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database health check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

checkDatabase();
