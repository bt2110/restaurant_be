/**
 * Script khởi tạo Roles mặc định
 * Chạy: node scripts/init-roles.js
 */

const dotenv = require('dotenv');
const db = require('../models');

dotenv.config();

const { Role } = db;

const ROLES = [
  { role_id: 1, role_name: 'Admin', permissions: { manage_users: true, manage_staff: true, manage_branches: true, manage_menu: true, manage_orders: true, manage_roles: true, view_analytics: true } },
  { role_id: 2, role_name: 'Manager', permissions: { manage_staff: true, manage_branches: true, manage_menu: true, manage_orders: true, view_analytics: true } },
  { role_id: 3, role_name: 'Staff', permissions: { manage_orders: true, manage_menu: true } },
  { role_id: 4, role_name: 'Customer', permissions: { create_order: true, view_menu: true } }
];

const initRoles = async () => {
  try {
    console.log('🔄 Đang khởi tạo Roles...');

    for (const role of ROLES) {
      const [roleRecord, created] = await Role.findOrCreate({
        where: { role_id: role.role_id },
        defaults: role
      });

      if (created) {
        console.log(`✅ Tạo Role: ${role.role_name} (ID: ${role.role_id})`);
      } else {
        console.log(`✅ Role ${role.role_name} (ID: ${role.role_id}) đã tồn tại`);
      }
    }

    console.log('\n✨ Tất cả Roles đã được khởi tạo thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khởi tạo Roles:', error.message);
    process.exit(1);
  }
};

initRoles();
