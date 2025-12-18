-- Restaurant Database Schema
-- MySQL 5.7+
-- Auto-generated from Sequelize models

-- Disable foreign key checks for dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables (be careful in production!)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS userbranch;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menu_categories;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS branches;

SET FOREIGN_KEY_CHECKS = 1;

-- ===== BRANCHES TABLE =====
CREATE TABLE branches (
  branch_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  branch_name VARCHAR(60) NOT NULL,
  branch_address VARCHAR(255),
  branch_phone VARCHAR(20),
  description VARCHAR(500),
  is_delete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_branches_rid (rid),
  INDEX idx_branches_name (branch_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ROLES TABLE =====
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSON DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== USERS TABLE =====
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  user_phone VARCHAR(20),
  user_address VARCHAR(500),
  role_id INT DEFAULT 4,
  lock_up BOOLEAN DEFAULT FALSE,
  lock_up_at DATETIME,
  last_login DATETIME,
  login_attempt INT DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_rid (rid),
  INDEX idx_users_role_id (role_id),
  CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== TABLES TABLE =====
CREATE TABLE tables (
  table_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  table_name VARCHAR(60) NOT NULL,
  description VARCHAR(255),
  branch_id INT NOT NULL,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tables_branch_id (branch_id),
  INDEX idx_tables_rid (rid),
  CONSTRAINT fk_tables_branch_id FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== MENU CATEGORIES TABLE =====
CREATE TABLE menu_categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  branch_id INT NOT NULL,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_branch_id (branch_id),
  INDEX idx_categories_rid (rid),
  CONSTRAINT fk_categories_branch_id FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== MENU ITEMS TABLE =====
CREATE TABLE menu_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  category_id INT NOT NULL,
  branch_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_items_category_id (category_id),
  INDEX idx_items_branch_id (branch_id),
  INDEX idx_items_rid (rid),
  CONSTRAINT fk_items_category_id FOREIGN KEY (category_id) REFERENCES menu_categories(category_id) ON DELETE CASCADE,
  CONSTRAINT fk_items_branch_id FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ORDERS TABLE =====
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  table_id INT NOT NULL,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  order_status VARCHAR(50) DEFAULT 'pending',
  total_price DECIMAL(10,2) DEFAULT 0,
  order_notes TEXT,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_table_id (table_id),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_branch_id (branch_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_rid (rid),
  CONSTRAINT fk_orders_table_id FOREIGN KEY (table_id) REFERENCES tables(table_id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_branch_id FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
  CONSTRAINT ck_order_status CHECK(order_status IN ('pending', 'in_progress', 'completed', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ORDER ITEMS TABLE =====
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_item_id (item_id),
  INDEX idx_order_items_rid (rid),
  CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_item_id FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE RESTRICT,
  CONSTRAINT ck_quantity CHECK(quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_rid (rid),
  CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== USER BRANCH RELATIONSHIP TABLE =====
CREATE TABLE userbranch (
  userbranch_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_branch (user_id, branch_id),
  INDEX idx_userbranch_user_id (user_id),
  INDEX idx_userbranch_branch_id (branch_id),
  CONSTRAINT fk_userbranch_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_userbranch_branch_id FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== PASSWORD RESET TOKENS TABLE =====
CREATE TABLE password_reset_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_tokens_user_id (user_id),
  INDEX idx_reset_tokens_token (token),
  CONSTRAINT fk_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== EMAIL VERIFICATION TOKENS TABLE =====
CREATE TABLE email_verification_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verify_tokens_user_id (user_id),
  INDEX idx_verify_tokens_token (token),
  CONSTRAINT fk_verify_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== AUDIT LOGS TABLE =====
CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_table (table_name),
  INDEX idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
