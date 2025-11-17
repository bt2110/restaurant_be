-- Restaurant Database Schema
-- PostgreSQL 12+
-- Auto-generated from Sequelize models

-- Drop existing tables (be careful in production!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS userbranch CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- ===== BRANCHES TABLE =====
CREATE TABLE branches (
  branch_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  branch_name VARCHAR(60) NOT NULL,
  branch_address VARCHAR(255),
  branch_phone VARCHAR(20),
  description VARCHAR(500),
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branches_rid ON branches(rid);
CREATE INDEX idx_branches_name ON branches(branch_name);

-- ===== ROLES TABLE =====
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(role_name);

-- ===== USERS TABLE =====
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  user_phone VARCHAR(20),
  user_address VARCHAR(500),
  role_id INT DEFAULT 4 REFERENCES roles(role_id) ON DELETE SET NULL,
  lock_up BOOLEAN DEFAULT FALSE,
  lock_up_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempt INT DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rid ON users(rid);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ===== TABLES TABLE =====
CREATE TABLE tables (
  table_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  table_name VARCHAR(60) NOT NULL,
  description VARCHAR(255),
  branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tables_branch_id ON tables(branch_id);
CREATE INDEX idx_tables_rid ON tables(rid);

-- ===== MENU CATEGORIES TABLE =====
CREATE TABLE menu_categories (
  category_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_branch_id ON menu_categories(branch_id);
CREATE INDEX idx_categories_rid ON menu_categories(rid);

-- ===== MENU ITEMS TABLE =====
CREATE TABLE menu_items (
  item_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  category_id INT NOT NULL REFERENCES menu_categories(category_id) ON DELETE CASCADE,
  branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_category_id ON menu_items(category_id);
CREATE INDEX idx_items_branch_id ON menu_items(branch_id);
CREATE INDEX idx_items_rid ON menu_items(rid);

-- ===== ORDERS TABLE =====
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  table_id INT NOT NULL REFERENCES tables(table_id) ON DELETE RESTRICT,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  order_status VARCHAR(50) DEFAULT 'pending' CHECK(order_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  total_price DECIMAL(10,2) DEFAULT 0,
  order_notes TEXT,
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_rid ON orders(rid);

-- ===== ORDER ITEMS TABLE =====
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK(quantity > 0),
  item_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
CREATE INDEX idx_order_items_rid ON order_items(rid);

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  rid VARCHAR(32) UNIQUE NOT NULL,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_rid ON notifications(rid);

-- ===== USER BRANCH RELATIONSHIP TABLE =====
CREATE TABLE userbranch (
  userbranch_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, branch_id)
);

CREATE INDEX idx_userbranch_user_id ON userbranch(user_id);
CREATE INDEX idx_userbranch_branch_id ON userbranch(branch_id);

-- ===== PASSWORD RESET TOKENS TABLE =====
CREATE TABLE password_reset_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

-- ===== EMAIL VERIFICATION TOKENS TABLE =====
CREATE TABLE email_verification_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verify_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_verify_tokens_token ON email_verification_tokens(token);

-- ===== AUDIT LOGS TABLE =====
CREATE TABLE audit_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ===== COMMENTS =====
COMMENT ON TABLE branches IS 'Restaurant branch locations';
COMMENT ON TABLE roles IS 'User role definitions with permissions';
COMMENT ON TABLE users IS 'System users with authentication';
COMMENT ON TABLE tables IS 'Dining tables per branch';
COMMENT ON TABLE menu_categories IS 'Menu food categories';
COMMENT ON TABLE menu_items IS 'Individual menu items';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_items IS 'Items in each order';
COMMENT ON TABLE notifications IS 'System notifications';
COMMENT ON TABLE userbranch IS 'User-to-branch relationships';
COMMENT ON TABLE audit_logs IS 'Transaction audit trail';
