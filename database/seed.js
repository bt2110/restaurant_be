#!/usr/bin/env node
/**
 * Seed Sample Data Script
 * Populates database with realistic sample data for testing
 */

require('dotenv').config();
const db = require('../models');
const ridUtil = require('../utils/ridUtil');

async function seedData() {
  try {
    const { Branch, Table, MenuCategory, MenuItem, User, Order, OrderItem, sequelize } = db;
    
    // Truncate tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToTruncate = ['notifications', 'order_items', 'orders', 'userbranch', 'tables', 'menu_items', 'menu_categories', 'branches', 'users'];
    for (const table of tablesToTruncate) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table};`);
      } catch (err) {
        // Ignore errors
      }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Reset RID counters
    await ridUtil.initializeCounters();
    
    // Create branches
    const branches = await Promise.all([
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Downtown Restaurant',
        description: 'Main branch in city center with premium seating',
        branch_phone: '555-0101'
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Westside Eatery',
        description: 'Casual dining in commerce district',
        branch_phone: '555-0102'
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Harbor View Café',
        description: 'Scenic waterfront location',
        branch_phone: '555-0103'
      })
    ]);
    
    // Create users
    const bcrypt = require('bcryptjs');
    const users = [];
    
    // Managers
    for (let i = 1; i <= 2; i++) {
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash('Manager@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: `Manager ${i}`,
        email: `manager${i}@restaurant.com`,
        password: pass,
        role_id: 2,
        is_active: true,
        user_phone: `555-100${i}`
      }));
    }
    
    // Staff members
    for (let i = 1; i <= 5; i++) {
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash('Staff@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: `Staff Member ${i}`,
        email: `staff${i}@restaurant.com`,
        password: pass,
        role_id: 3,
        is_active: true,
        user_phone: `555-200${i}`
      }));
    }
    
    // Customers
    for (let i = 1; i <= 5; i++) {
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash('Customer@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: `Customer ${i}`,
        email: `customer${i}@email.com`,
        password: pass,
        role_id: 4,
        is_active: true,
        user_phone: `555-300${i}`
      }));
    }
    
    // Create tables
    const tables = [];
    for (let branchIdx = 0; branchIdx < branches.length; branchIdx++) {
      for (let tableNum = 1; tableNum <= 5; tableNum++) {
        tables.push(await Table.create({
          rid: ridUtil.generateRid('tbl'),
          table_name: `Table ${tableNum}`,
          description: `Seating for 2-8 guests`,
          branch_id: branches[branchIdx].branch_id
        }));
      }
    }
    
    // Create menu categories
    const categories = await Promise.all([
      MenuCategory.create({
        rid: ridUtil.generateRid('cat'),
        category_name: 'Appetizers',
        description: 'Starters and small bites',
        branch_id: branches[0].branch_id
      }),
      MenuCategory.create({
        rid: ridUtil.generateRid('cat'),
        category_name: 'Main Courses',
        description: 'Entrees and main dishes',
        branch_id: branches[0].branch_id
      }),
      MenuCategory.create({
        rid: ridUtil.generateRid('cat'),
        category_name: 'Desserts',
        description: 'Sweet treats and desserts',
        branch_id: branches[0].branch_id
      }),
      MenuCategory.create({
        rid: ridUtil.generateRid('cat'),
        category_name: 'Beverages',
        description: 'Drinks and beverages',
        branch_id: branches[0].branch_id
      })
    ]);
    
    // Create menu items
    const items = await Promise.all([
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Bruschetta', description: 'Crispy bread with tomatoes and basil', category_id: categories[0].category_id, branch_id: branches[0].branch_id, price: 8.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Calamari Fritti', description: 'Fried squid with marinara sauce', category_id: categories[0].category_id, branch_id: branches[0].branch_id, price: 12.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs', category_id: categories[1].category_id, branch_id: branches[0].branch_id, price: 24.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Ribeye Steak', description: 'Premium cut steak, cooked to order', category_id: categories[1].category_id, branch_id: branches[0].branch_id, price: 34.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Pasta Carbonara', description: 'Classic Italian pasta with bacon and cream', category_id: categories[1].category_id, branch_id: branches[0].branch_id, price: 16.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Chicken Parmesan', description: 'Crispy chicken with tomato sauce and mozzarella', category_id: categories[1].category_id, branch_id: branches[0].branch_id, price: 18.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Tiramisu', description: 'Traditional Italian dessert with mascarpone', category_id: categories[2].category_id, branch_id: branches[0].branch_id, price: 9.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', category_id: categories[2].category_id, branch_id: branches[0].branch_id, price: 10.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'House Wine', description: 'Selection of red, white, and rosé', category_id: categories[3].category_id, branch_id: branches[0].branch_id, price: 7.99 }),
      MenuItem.create({ rid: ridUtil.generateRid('itm'), item_name: 'Espresso', description: 'Single or double shot', category_id: categories[3].category_id, branch_id: branches[0].branch_id, price: 3.99 })
    ]);
    
    // Create sample orders
    const order1 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[0].table_id,
      user_id: users[7].user_id,
      branch_id: branches[0].branch_id,
      order_status: 'completed',
      total_price: 58.97,
      order_notes: 'No onions on the bruschetta'
    });
    
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order1.order_id, item_id: items[0].item_id, quantity: 2, item_price: 8.99 });
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order1.order_id, item_id: items[2].item_id, quantity: 2, item_price: 24.99 });
    
    const order2 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[5].table_id,
      user_id: users[8].user_id,
      branch_id: branches[1].branch_id,
      order_status: 'pending',
      total_price: 42.98
    });
    
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order2.order_id, item_id: items[3].item_id, quantity: 1, item_price: 34.99 });
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order2.order_id, item_id: items[9].item_id, quantity: 1, item_price: 3.99 });
    
    const order3 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[10].table_id,
      user_id: users[9].user_id,
      branch_id: branches[2].branch_id,
      order_status: 'in_progress',
      total_price: 51.97
    });
    
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order3.order_id, item_id: items[4].item_id, quantity: 2, item_price: 16.99 });
    await OrderItem.create({ rid: ridUtil.generateRid('ord'), order_id: order3.order_id, item_id: items[6].item_id, quantity: 1, item_price: 9.99 });
    
    // Summary
    console.log('✅ Sample data seeding completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
