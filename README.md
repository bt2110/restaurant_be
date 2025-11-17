# Restaurant Backend API

Professional Node.js Express REST API for restaurant management with authentication, role-based access control, menu management, order processing, and branch management.

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- npm 7.x or higher

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (copy from .env.example or set manually)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
ADMIN_DEFAULT_PASSWORD=Admin@123456

# 3. Initialize database
npm run db:init

# 4. Populate sample data (optional)
npm run db:seed

# 5. Start server
npm run dev              # Development with nodemon
npm start               # Production
```

Server runs on `http://localhost:3000`  
API Docs: `http://localhost:3000/api-docs`

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | Admin@123456 |
| Manager | manager1@restaurant.com | Manager@123456 |
| Staff | staff1@restaurant.com | Staff@123456 |
| Customer | customer1@email.com | Customer@123456 |

---

## 📝 npm Scripts

```bash
# Database
npm run db:init        # Initialize DB with schema + 4 roles + admin
npm run db:seed        # Add sample data (3 branches, 12 users, etc)
npm run db:check       # Check database health

# Server
npm start              # Production mode
npm run dev            # Development with auto-reload

# Utilities (Advanced)
npm run reset-db       # Reset database to blank state
npm run init:roles     # Initialize roles only
npm run init:admin     # Initialize admin user only
```

---

## 📋 API Endpoints

### Authentication (No Auth Required)
```
POST   /api/auth/login              Login user
POST   /api/auth/register           Register customer
```

### Users (Admin/Manager)
```
GET    /api/users                   List all users
GET    /api/users/:id               Get user by ID
POST   /api/users                   Create staff account
PUT    /api/users/:id               Update user
DELETE /api/users/:id               Delete user
POST   /api/users/assign-role       Assign role to user (Admin)
```

### Roles (Admin)
```
GET    /api/roles                   List all roles
GET    /api/roles/:id               Get role details
```

### Branches (Admin)
```
GET    /api/branches                List all branches
GET    /api/branches/:id            Get branch details
POST   /api/branches                Create branch
PUT    /api/branches/:id            Update branch
DELETE /api/branches/:id            Delete branch
```

### Tables (Manager)
```
GET    /api/tables                  List tables
GET    /api/tables/:id              Get table details
POST   /api/tables                  Create table
PUT    /api/tables/:id              Update table
DELETE /api/tables/:id              Delete table
```

### Menu Categories (Manager)
```
GET    /api/categories              List categories
POST   /api/categories              Create category
PUT    /api/categories/:id          Update category
DELETE /api/categories/:id          Delete category
```

### Menu Items (Manager)
```
GET    /api/items                   List items
GET    /api/items/:id               Get item details
POST   /api/items                   Create item
PUT    /api/items/:id               Update item
DELETE /api/items/:id               Delete item
```

### Orders (Staff/Manager)
```
GET    /api/orders                  List orders
GET    /api/orders/:id              Get order details
POST   /api/orders                  Create order
PUT    /api/orders/:id              Update order status
DELETE /api/orders/:id              Delete order
```

### Notifications (Admin)
```
GET    /api/notifications           Get notifications
POST   /api/notifications           Create notification
PUT    /api/notifications/:id       Update notification
DELETE /api/notifications/:id       Delete notification
```

---

## 🔄 Authentication

All endpoints except `/auth/login` and `/auth/register` require Bearer token:

```bash
curl -X GET http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Or use Swagger UI "Authorize" button to set token globally.

---

## 📊 Sample Data

Running `npm run db:seed` creates:
- **3 Branches** - Restaurant locations
- **12 Users** - 1 admin, 2 managers, 5 staff, 5 customers
- **15 Tables** - 5 per branch
- **4 Categories** - Appetizers, Main Courses, Desserts, Beverages
- **10 Menu Items** - Various dishes and drinks
- **3 Orders** - With items and details

---

## 🗄️ Database Schema

13 Tables:
- `users` - User accounts
- `roles` - Role definitions (admin, manager, staff, customer)
- `branches` - Restaurant locations
- `tables` - Dining tables
- `menu_categories` - Food categories
- `menu_items` - Individual menu items
- `orders` - Customer orders
- `order_items` - Items per order
- `userbranch` - User-to-branch mapping
- `notifications` - System notifications
- `password_reset_tokens` - Password recovery
- `email_verification_tokens` - Email verification
- `audit_logs` - Transaction history

---

## 🔄 Sequential RID System

All records use sequential IDs (RID) for readability:

```
br-1000, br-1001, br-1002...      (Branches)
usr-1000, usr-1001...             (Users)
tbl-1000, tbl-1001...             (Tables)
cat-1000...                       (Categories)
itm-1000, itm-1001...             (Menu Items)
ord-1000, ord-1001...             (Orders)
notif-1000...                     (Notifications)
```

---

## 👥 Role-Based Access

**Admin** (role_id: 1)
- Full system access, manage users/roles/branches, view analytics

**Manager** (role_id: 2)
- Branch management, staff supervision, menu & table management

**Staff** (role_id: 3)
- Order processing, table management, view orders

**Customer** (role_id: 4)
- View menu, place orders, view own orders

---

## 📁 Project Structure

```
restaurant-backend/
├── server.js                    Entry point
├── package.json                 Dependencies
├── config/                      Configuration
├── models/                      Sequelize ORM models
├── controllers/                 Request handlers
├── services/                    Business logic
├── routes/                      API routes
├── utils/                       Utilities (JWT, validation, RID)
├── middleware/                  Express middleware
├── database/                    Database scripts
│   ├── init.js                 Initialize DB
│   ├── seed.js                 Populate data
│   ├── check.js                Health check
│   ├── schema.sql              SQL schema
│   └── README.md               Database docs
└── scripts/                     Legacy scripts
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Run `npm run db:init` |
| Missing tables | Check: `npm run db:check` |
| Port 3000 in use | Change PORT in .env or kill process |
| JWT token expired | Login again to get new token |
| Database error | Verify PostgreSQL running and credentials correct |

---

## 🔗 Swagger Documentation

Interactive API documentation available at `http://localhost:3000/api-docs`

Features:
- Try endpoints directly
- Automatic authorization token management
- Request/response examples
- Complete endpoint documentation

---

## 📝 Environment Variables

```env
DB_HOST              PostgreSQL host (default: localhost)
DB_PORT              PostgreSQL port (default: 5432)
DB_NAME              Database name (default: restaurant_db)
DB_USER              Database user (default: postgres)
DB_PASSWORD          Database password (required)
PORT                 Server port (default: 3000)
NODE_ENV             Environment (development/production)
JWT_SECRET           JWT signing secret (required)
JWT_EXPIRES_IN       Token expiration (default: 7d)
ADMIN_DEFAULT_PASSWORD Default admin password (default: Admin@123456)
```

---

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Generate strong `JWT_SECRET`
3. Configure production PostgreSQL
4. Use process manager (PM2): `pm2 start server.js --name restaurant-api`
5. Setup SSL/HTTPS with reverse proxy
6. Enable database backups

---

## 📝 Development Notes

- All endpoints require authentication except login/register
- Responses include `success` boolean and `message` field
- Timestamps use ISO 8601 format
- Sequential RID system ensures consistent record identification
- Role permissions enforced at controller level

---

**Version:** 1.0.0  
**Framework:** Express 5.1.0  
**Database:** PostgreSQL 12+  
**Last Updated:** November 2024

