/**
 * Script tạo tài khoản Admin mặc định
 * Chạy: node scripts/init-admin.js
 */

const dotenv = require('dotenv');
const db = require('../models');
const bcrypt = require('bcryptjs');

dotenv.config();

const { User, Role } = db;

const initAdmin = async () => {
  try {
    console.log('🔄 Đang khởi tạo tài khoản Admin...');

    // Kiểm tra admin có tồn tại không
    const adminRole = await Role.findOne({ where: { role_id: 1 } });
    if (!adminRole) {
      console.error('❌ Role Admin (ID: 1) chưa tồn tại trong database');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (existingAdmin) {
      console.log('✅ Admin đã tồn tại: admin@restaurant.com');
      process.exit(0);
    }

    // Mật khẩu mặc định: Admin@123456
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Tạo admin
    const admin = await User.create({
      rid: `usr-${Date.now()}`,
      user_name: 'Administrator',
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role_id: 1, // Admin role
      lock_up: false,
      email_verified: true
    });

    console.log('✅ Tài khoản Admin đã được tạo thành công!');
    console.log('📧 Email: admin@restaurant.com');
    console.log(`🔐 Mật khẩu: ${defaultPassword}`);
    console.log('\n⚠️  Hãy thay đổi mật khẩu ngay sau lần đăng nhập đầu tiên!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khởi tạo Admin:', error.message);
    process.exit(1);
  }
};

initAdmin();
