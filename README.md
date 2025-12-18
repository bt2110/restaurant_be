# Restaurant Backend API

Professional Node.js Express REST API for restaurant management with authentication, role-based access control, menu management, order processing, and branch management.

## 🚀 Quick Start

### 30-second setup:
```bash
npm run docker:up    # Không cần nếu dùng database local
npm install          # Install dependencies
npm run db:init      # Initialize database
npm run dev          # Start server
```

Server: http://localhost:3000  
API Docs: http://localhost:3000/api-docs

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

# Server
npm start              # Production mode
npm run dev            # Development with auto-reload

# Docker
npm run docker:up      # Start MySQL container
npm run docker:down    # Stop MySQL container
npm run docker:logs    # View MySQL logs
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

13 Tables (MySQL 5.7+):
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
├── docker-compose.yml           Docker MySQL setup
├── config/                      Configuration files
│   ├── database.js             Database connection config
│   └── swagger.js              API documentation config
├── models/                      Sequelize ORM models (13 tables)
├── controllers/                 Request handlers (8 modules)
├── services/                    Business logic layer
├── routes/                      API endpoint routes
├── middleware/                  Express middleware
├── utils/                       Utilities (JWT, validation, RID system)
├── database/                    Database management
│   ├── init.js                 Initialize schema + roles + admin
│   ├── seed.js                 Populate sample data
│   └── schema.sql              MySQL schema definition
└── scripts/                     Seed data script
    └── seed-sample-data.js     Additional sample data
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | Change PORT in .env or kill process on 3000 |
| MySQL connection failed | Run `npm run docker:up` or check DB_HOST in .env |
| Missing tables | Run `npm run db:init` to initialize schema |
| Port 3306 in use | Change DB_PORT in .env |
| JWT token expired | Login again to get new token |
| Database error | Check MySQL logs with `npm run docker:logs` |

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
DB_HOST              MySQL host (default: localhost)
DB_PORT              MySQL port (default: 3306)
DB_NAME              Database name (default: restaurant_db)
DB_USER              Database user (default: root)
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
3. Configure production MySQL database
4. Use process manager (PM2): `pm2 start server.js --name restaurant-api`
5. Setup SSL/HTTPS with reverse proxy
6. Enable database backups and scheduled maintenance

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
**Database:** MySQL 5.7+  
**Last Updated:** December 2024

