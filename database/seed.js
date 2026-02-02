#!/usr/bin/env node
/**
 * Seed Comprehensive Sample Data Script
 * Populates database with realistic Vietnamese restaurant sample data
 * Includes: Branches, Roles, Users, Tables, Categories, Items, Orders, Notifications
 */

require('dotenv').config();
const db = require('../models');
const ridUtil = require('../utils/ridUtil');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    const { Branch, Role, User, Table, MenuCategory, MenuItem, Order, OrderItem, Notification, sequelize } = db;
    
    console.log('🔄 Starting comprehensive data seeding...');
    
    // Truncate tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToTruncate = [
      'audit_logs', 'notifications', 'order_items', 'orders', 'userbranch', 
      'tables', 'menu_items', 'menu_categories', 'branches', 'users', 'roles'
    ];
    for (const table of tablesToTruncate) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table};`);
      } catch (err) {
        // Ignore errors
      }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Tables truncated');
    
    // Reset RID counters
    await ridUtil.initializeCounters();
    
    // ============================================================================
    // 1. CREATE ROLES
    // ============================================================================
    const roles = await Promise.all([
      Role.create({
        role_name: 'admin',
        description: 'Administrator with full access',
        is_active: true
      }),
      Role.create({
        role_name: 'manager',
        description: 'Manager with branch management permissions',
        is_active: true
      }),
      Role.create({
        role_name: 'staff',
        description: 'Staff member for order management',
        is_active: true
      }),
      Role.create({
        role_name: 'customer',
        description: 'Customer role',
        is_active: true
      })
    ]);
    console.log('✓ Roles created:', roles.length);
    
    // ============================================================================
    // 2. CREATE BRANCHES (Chi nhánh Việt Nam)
    // ============================================================================
    const branches = await Promise.all([
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Chi nhánh Hà Nội',
        description: 'Nhà hàng ở phố Hàng Ngoài, Hà Nội - Chuyên phục vụ các món ăn Việt Nam truyền thống',
        branch_phone: '(024) 3826-7890'
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Chi nhánh Sài Gòn',
        description: 'Cơ sở tại quận 1, TP.HCM - Không khí ấm cúng với view thành phố',
        branch_phone: '(028) 3823-4567'
      }),
      Branch.create({
        rid: ridUtil.generateRid('br'),
        branch_name: 'Chi nhánh Đà Nẵng',
        description: 'Nhà hàng view biển tại Bãi Mỹ Khê - Nơi tuyệt vời để thưởng thức hải sản tươi',
        branch_phone: '(0236) 3822-1111'
      })
    ]);
    console.log('✓ Branches created:', branches.length);
    
    // ============================================================================
    // 3. CREATE USERS
    // ============================================================================
    const users = [];
    
    // Admin
    let salt = await bcrypt.genSalt(10);
    let pass = await bcrypt.hash('Admin@123456', salt);
    users.push(await User.create({
      rid: ridUtil.generateRid('usr'),
      user_name: 'Admin Hệ Thống',
      email: 'admin@restaurant.com',
      password: pass,
      role_id: roles[0].role_id,
      is_active: true,
      user_phone: '0987654321',
      email_verified: true,
      email_verified_at: new Date()
    }));
    
    // Managers
    for (let i = 0; i < branches.length; i++) {
      salt = await bcrypt.genSalt(10);
      pass = await bcrypt.hash('Manager@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: `Quản lý ${branches[i].branch_name}`,
        email: `manager${i + 1}@restaurant.com`,
        password: pass,
        role_id: roles[1].role_id,
        is_active: true,
        user_phone: `090${1000000 + i}`,
        email_verified: true,
        email_verified_at: new Date()
      }));
    }
    
    // Staff members (3 per branch)
    for (let branchIdx = 0; branchIdx < branches.length; branchIdx++) {
      for (let i = 1; i <= 3; i++) {
        salt = await bcrypt.genSalt(10);
        pass = await bcrypt.hash('Staff@123456', salt);
        users.push(await User.create({
          rid: ridUtil.generateRid('usr'),
          user_name: `Nhân viên ${i} - ${branches[branchIdx].branch_name}`,
          email: `staff${branchIdx}_${i}@restaurant.com`,
          password: pass,
          role_id: roles[2].role_id,
          is_active: true,
          user_phone: `091${2000000 + branchIdx * 10 + i}`,
          email_verified: true,
          email_verified_at: new Date()
        }));
      }
    }
    
    // Customers
    const customerNames = ['Nguyễn Văn A', 'Trần Thị B', 'Phạm Quốc C', 'Lê Hồng D', 'Đỗ Minh E'];
    for (let i = 0; i < customerNames.length; i++) {
      salt = await bcrypt.genSalt(10);
      pass = await bcrypt.hash('Customer@123456', salt);
      users.push(await User.create({
        rid: ridUtil.generateRid('usr'),
        user_name: customerNames[i],
        email: `customer${i + 1}@email.com`,
        password: pass,
        role_id: roles[3].role_id,
        is_active: true,
        user_phone: `092${3000000 + i}`,
        email_verified: true,
        email_verified_at: new Date()
      }));
    }
    console.log('✓ Users created:', users.length);
    
    // ============================================================================
    // 4. CREATE TABLES
    // ============================================================================
    const tables = [];
    for (let branchIdx = 0; branchIdx < branches.length; branchIdx++) {
      for (let tableNum = 1; tableNum <= 6; tableNum++) {
        tables.push(await Table.create({
          rid: ridUtil.generateRid('tbl'),
          table_name: `Bàn số ${tableNum}`,
          description: `Bàn ăn cho 2-8 khách`,
          branch_id: branches[branchIdx].branch_id
        }));
      }
    }
    console.log('✓ Tables created:', tables.length);
    
    // ============================================================================
    // 5. CREATE MENU CATEGORIES
    // ============================================================================
    const categoryData = [
      { name: 'Khai vị', desc: 'Các món khai vị nhẹ nhàng' },
      { name: 'Canh & Súp', desc: 'Canh nóng và những món súp truyền thống' },
      { name: 'Cơm & Mì Ý', desc: 'Cơm, mì ý và các món ăn chính' },
      { name: 'Thịt nướng', desc: 'Các món thịt nướng hấp dẫn' },
      { name: 'Hải sản', desc: 'Hải sản tươi sống' },
      { name: 'Tráng miệng', desc: 'Các món tráng miệng ngon lành' },
      { name: 'Đồ uống', desc: 'Nước uống, bia rượu và cà phê' }
    ];
    
    const categories = await Promise.all(
      categoryData.map(cat => 
        MenuCategory.create({
          rid: ridUtil.generateRid('cat'),
          category_name: cat.name,
          description: cat.desc,
          branch_id: branches[0].branch_id
        })
      )
    );
    console.log('✓ Categories created:', categories.length);
    
    // ============================================================================
    // 6. CREATE MENU ITEMS
    // ============================================================================
    const itemsData = [
      // Khai vị
      { name: 'Gỏi cuốn', desc: 'Cuốn hành với tôm, thịt lợn', cat: 0, price: 35000 },
      { name: 'Cánh gà nước mắm', desc: 'Cánh gà chiên mặn mặn', cat: 0, price: 50000 },
      { name: 'Bánh mẫn', desc: 'Bánh chiên vàng giòn', cat: 0, price: 40000 },
      // Canh & Súp
      { name: 'Canh chua cá', desc: 'Canh chua với cá lóc hoặc cá chép', cat: 1, price: 60000 },
      { name: 'Canh vịt tiến', desc: 'Canh vịt nấu với tiến', cat: 1, price: 80000 },
      // Cơm & Mì Ý
      { name: 'Cơm tấm sườn nướng', desc: 'Cơm tấm với sườn lợn nướng', cat: 2, price: 45000 },
      { name: 'Pasta Carbonara', desc: 'Mì Ý với thịt xông khói và kem', cat: 2, price: 85000 },
      { name: 'Cơm chiên Thái', desc: 'Cơm chiên kiểu Thái với tôm và cua', cat: 2, price: 55000 },
      // Thịt nướng
      { name: 'Thịt dê nướng', desc: 'Thịt dê tươi nướng với gia vị', cat: 3, price: 150000 },
      { name: 'Gà nướng mặn mặn', desc: 'Gà nguyên con nướng vàng đều', cat: 3, price: 120000 },
      // Hải sản
      { name: 'Cua hoàng đế hấp bia', desc: 'Cua hoàng đế hấp với bia tươi', cat: 4, price: 200000 },
      { name: 'Tôm sú nướng muối', desc: 'Tôm sú to nướng muối tỏi', cat: 4, price: 180000 },
      { name: 'Cá nướng giấy bạc', desc: 'Cá nướng trong giấy bạc với rau thơm', cat: 4, price: 160000 },
      // Tráng miệng
      { name: 'Chè ba màu', desc: 'Chè ba màu truyền thống Việt Nam', cat: 5, price: 30000 },
      { name: 'Bánh flan', desc: 'Bánh flan mềm mịn với caramel', cat: 5, price: 25000 },
      // Đồ uống
      { name: 'Nước chanh muối', desc: 'Nước chanh tươi với muối tây', cat: 6, price: 20000 },
      { name: 'Cà phê đen', desc: 'Cà phê đen Việt Nam', cat: 6, price: 15000 },
      { name: 'Bia Hà Nội', desc: 'Bia Hà Nội lạnh lẻo', cat: 6, price: 35000 }
    ];
    
    const items = await Promise.all(
      itemsData.map(item =>
        MenuItem.create({
          rid: ridUtil.generateRid('itm'),
          item_name: item.name,
          description: item.desc,
          category_id: categories[item.cat].category_id,
          branch_id: branches[0].branch_id,
          price: item.price
        })
      )
    );
    console.log('✓ Menu items created:', items.length);
    
    // ============================================================================
    // 7. CREATE ORDERS & ORDER ITEMS
    // ============================================================================
    const orders = [];
    
    // Order 1: Completed
    const ord1 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[0].table_id,
      user_id: users[4].user_id, // staff member
      branch_id: branches[0].branch_id,
      order_status: 'completed',
      total_price: 140000,
      order_notes: 'Không hành, không tỏi'
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord1.order_id,
      item_id: items[0].item_id,
      quantity: 2,
      item_price: 35000
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord1.order_id,
      item_id: items[5].item_id,
      quantity: 2,
      item_price: 55000
    });
    orders.push(ord1);
    
    // Order 2: Pending
    const ord2 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[6].table_id,
      user_id: users[5].user_id, // staff member
      branch_id: branches[1].branch_id,
      order_status: 'pending',
      total_price: 380000,
      order_notes: 'Vừa chín, tôm to'
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord2.order_id,
      item_id: items[11].item_id,
      quantity: 1,
      item_price: 180000
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord2.order_id,
      item_id: items[14].item_id,
      quantity: 2,
      item_price: 100000
    });
    orders.push(ord2);
    
    // Order 3: In progress
    const ord3 = await Order.create({
      rid: ridUtil.generateRid('ord'),
      table_id: tables[12].table_id,
      user_id: users[6].user_id, // staff member
      branch_id: branches[2].branch_id,
      order_status: 'in_progress',
      total_price: 300000
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord3.order_id,
      item_id: items[9].item_id,
      quantity: 1,
      item_price: 150000
    });
    await OrderItem.create({
      rid: ridUtil.generateRid('ord'),
      order_id: ord3.order_id,
      item_id: items[12].item_id,
      quantity: 1,
      item_price: 160000
    });
    orders.push(ord3);
    
    console.log('✓ Orders created:', orders.length);
    
    // ============================================================================
    // 8. CREATE NOTIFICATIONS
    // ============================================================================
    const notifications = await Promise.all([
      Notification.create({
        rid: ridUtil.generateRid('notif'),
        branch_id: branches[0].branch_id,
        order_id: orders[0].order_id,
        status_admin: 0,
        status_client: 0
      }),
      Notification.create({
        rid: ridUtil.generateRid('notif'),
        branch_id: branches[1].branch_id,
        order_id: orders[1].order_id,
        status_admin: 1,
        status_client: 0
      }),
      Notification.create({
        rid: ridUtil.generateRid('notif'),
        branch_id: branches[2].branch_id,
        order_id: orders[2].order_id,
        status_admin: 0,
        status_client: 1
      })
    ]);
    console.log('✓ Notifications created:', notifications.length);
    
    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n========== 🎉 SEEDING COMPLETED SUCCESSFULLY ==========');
    console.log(`✓ Roles: ${roles.length}`);
    console.log(`✓ Branches: ${branches.length}`);
    console.log(`✓ Users: ${users.length}`);
    console.log(`✓ Tables: ${tables.length}`);
    console.log(`✓ Categories: ${categories.length}`);
    console.log(`✓ Menu Items: ${items.length}`);
    console.log(`✓ Orders: ${orders.length}`);
    console.log(`✓ Notifications: ${notifications.length}`);
    console.log('========================================================\n');
    
    console.log('📝 Test Accounts:');
    console.log('   Admin: admin@restaurant.com / Admin@123456');
    console.log('   Manager: manager1@restaurant.com / Manager@123456');
    console.log('   Staff: staff0_1@restaurant.com / Staff@123456');
    console.log('   Customer: customer1@email.com / Customer@123456\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
