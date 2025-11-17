
 * Seed Sample Data Script
 * Populates database with realistic sample data for testing
 */

require('dotenv').config();
const db = require('../models');
const ridUtil = require('../utils/ridUtil');

async function seedData() {
  try {
    console.log('🌱 Starting sample data seeding...\n');
    
    const { Branch, Table, MenuCategory, MenuItem, User, Order, OrderItem, sequelize } = db;
    
    // Truncate tables (except roles which were initialized)
    console.log('🧹 Clearing existing data...');
    await sequelize.query('SET session_replication_role = replica;');
    const tablesToTruncate = ['notifications', 'order_items', 'orders', 'userbranch', 'tables', 'menu_items', 'menu_categories', 'branches', 'users'];
    for (const table of tablesToTruncate) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table} CASCADE;`);
      } catch (err) {
        // Ignore errors
      }
    }
    await sequelize.query('SET session_replication_role = DEFAULT;');
    
    // Reset RID counters to avoid duplicates
    await ridUtil.initializeCounters();
    
    // ===== CREATE BRANCHES =====
    console.log('🏢 Creating branches...');
    const branches = await Promise.all([
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Downtown Restaurant',
        branch_address: '123 Main St, City Center',
        branch_phone: '555-0101',
        is_active: true
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Westside Eatery',
        branch_address: '456 West Ave, Commerce District',
        branch_phone: '555-0102',
        is_active: true
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Harbor View Café',
        branch_address: '789 Harbor Blvd, Waterfront',
        branch_phone: '555-0103',
        is_active: true
      })
    ]);
    console.log(`  ✅ Created ${branches.length} branches\n`);
    
    // ===== CREATE USERS (Mixed roles) =====
    console.log('👥 Creating users...');
    const bcrypt = require('bcryptjs');
    const users = [];
    
    // Manager for branch 1
    const salt1 = await bcrypt.genSalt(10);
    const pass1 = await bcrypt.hash('Manager@123456', salt1);
    users.push(await User.create({
      rid: ridUtil.generateRid('usr'),
      user_name: 'John Manager',
      email: 'manager1@restaurant.com',
      password: pass1,
      role_id: 2, // manager
      is_active: true,
      user_phone: '555-1001'
    }));
    
    // Manager for branch 2
    const salt2 = await bcrypt.genSalt(10);
    const pass2 = await bcrypt.hash('Manager@123456', salt2);
    users.push(await User.create({
      rid: ridUtil.generateRid('usr'),
      user_name: 'Sarah Manager',
      email: 'manager2@restaurant.com',
      password: pass2,
      role_id: 2, // manager
      is_active: true,
      user_phone: '555-1002'
    }));
    
    // Staff members
    for (let i = 1; i <= 5; i++) {
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash('Staff@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: `Staff Member ${i}`,
        email: `staff${i}@restaurant.com`,
        password: pass,
        role_id: 3, // staff
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
        role_id: 4, // customer
        is_active: true,
        user_phone: `555-300${i}`
      }));
    }
    
    console.log(`  ✅ Created ${users.length} users\n`);
    
    // ===== CREATE TABLES =====
    console.log('🪑 Creating tables...');
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
    console.log(`  ✅ Created ${tables.length} tables\n`);
    
    // ===== CREATE MENU CATEGORIES =====
    console.log('📋 Creating menu categories...');
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
    console.log(`  ✅ Created ${categories.length} categories\n`);
    
    // ===== CREATE MENU ITEMS =====
    console.log('🍽️  Creating menu items...');
    const items = [];
    
    // Appetizers
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Bruschetta',
      description: 'Crispy bread with tomatoes and basil',
      category_id: categories[0].category_id,
      branch_id: branches[0].branch_id,
      price: 8.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Calamari Fritti',
      description: 'Fried squid with marinara sauce',
      category_id: categories[0].category_id,
      branch_id: branches[0].branch_id,
      price: 12.99
    }));
    
    // Main Courses
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with herbs',
      category_id: categories[1].category_id,
      branch_id: branches[0].branch_id,
      price: 24.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Ribeye Steak',
      description: 'Premium cut steak, cooked to order',
      category_id: categories[1].category_id,
      branch_id: branches[0].branch_id,
      price: 34.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Pasta Carbonara',
      description: 'Classic Italian pasta with bacon and cream',
      category_id: categories[1].category_id,
      branch_id: branches[0].branch_id,
      price: 16.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Chicken Parmesan',
      description: 'Crispy chicken with tomato sauce and mozzarella',
      category_id: categories[1].category_id,
      branch_id: branches[0].branch_id,
      price: 18.99
    }));
    
    // Desserts
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Tiramisu',
      description: 'Traditional Italian dessert with mascarpone',
      category_id: categories[2].category_id,
      branch_id: branches[0].branch_id,
      price: 9.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      category_id: categories[2].category_id,
      branch_id: branches[0].branch_id,
      price: 10.99
    }));
    
    // Beverages
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'House Wine',
      description: 'Selection of red, white, and rosé',
      category_id: categories[3].category_id,
      branch_id: branches[0].branch_id,
      price: 7.99
    }));
    items.push(await MenuItem.create({
      rid: ridUtil.generateRid('itm'),
      item_name: 'Espresso',
      description: 'Single or double shot',
      category_id: categories[3].category_id,
      branch_id: branches[0].branch_id,
      price: 3.99
    }));
    
    console.log(`  ✅ Created ${items.length} menu items\n`);
    
    // ===== CREATE ORDERS =====
    console.log('📦 Creating sample orders...');
    const orders = [];
    
    // Order 1
    const order1 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[0].table_id,
      user_id: users[7].user_id, // customer
      branch_id: branches[0].branch_id,
      order_status: 'completed',
      total_price: 58.97,
      order_notes: 'No onions on the bruschetta',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    orders.push(order1);
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order1.order_id,
      item_id: items[0].item_id,
      quantity: 2,
      item_price: 8.99
    });
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order1.order_id,
      item_id: items[2].item_id,
      quantity: 2,
      item_price: 24.99
    });
    
    // Order 2
    const order2 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[5].table_id,
      user_id: users[8].user_id, // customer
      branch_id: branches[1].branch_id,
      order_status: 'pending',
      total_price: 42.98,
      order_notes: 'Allergic to shellfish',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    });
    orders.push(order2);
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order2.order_id,
      item_id: items[3].item_id,
      quantity: 1,
      item_price: 34.99
    });
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order2.order_id,
      item_id: items[9].item_id,
      quantity: 1,
      item_price: 3.99
    });
    
    // Order 3
    const order3 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[10].table_id,
      user_id: users[9].user_id, // customer
      branch_id: branches[2].branch_id,
      order_status: 'in_progress',
      total_price: 51.97,
      order_notes: null,
      created_at: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    });
    orders.push(order3);
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order3.order_id,
      item_id: items[4].item_id,
      quantity: 2,
      item_price: 16.99
    });
    
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: order3.order_id,
      item_id: items[6].item_id,
      quantity: 1,
      item_price: 9.99
    });
    
    console.log(`  ✅ Created ${orders.length} orders\n`);
    
    // ===== SUMMARY =====
    console.log('✨ Sample data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Branches: ${branches.length}`);
    console.log(`   • Users: ${users.length} (1 Admin, 2 Managers, 5 Staff, 5 Customers)`);
    console.log(`   • Tables: ${tables.length} (5 per branch)`);
    console.log(`   • Menu Categories: ${categories.length}`);
    console.log(`   • Menu Items: ${items.length}`);
    console.log(`   • Orders: ${orders.length}\n`);
    
    console.log('🔑 Default Credentials:');
    console.log('   Admin: admin@restaurant.com / Admin@123456');
    console.log('   Manager: manager1@restaurant.com / Manager@123456');
    console.log('   Staff: staff1@restaurant.com / Staff@123456');
    console.log('   Customer: customer1@email.com / Customer@123456\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
