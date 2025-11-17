# Requirements & Setup Guide

## 🖥️ System Requirements

### Minimum
- **Node.js**: 16.13.0 or higher
- **npm**: 7.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **RAM**: 2GB minimum
- **Disk**: 1GB free space

### Recommended
- **Node.js**: 18.x or 20.x
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **RAM**: 4GB
- **CPU**: Multi-core processor

---

## 📦 Dependencies

### Production
```json
{
  "bcryptjs": "^3.0.3",           // Password hashing
  "chalk": "^4.1.2",              // Console colors
  "dotenv": "^17.2.3",            // Environment variables
  "express": "^5.1.0",            // Web framework
  "jsonwebtoken": "^9.0.2",       // JWT authentication
  "pg": "^8.16.3",                // PostgreSQL driver
  "sequelize": "^6.37.7",         // ORM
  "swagger-jsdoc": "^6.2.8",      // API documentation
  "swagger-ui-express": "^5.0.0", // Swagger UI
  "uuid": "^9.0.1"                // UUID generation
}
```

### Development
```json
{
  "nodemon": "^3.1.11"            // Auto-restart on changes
}
```

---

## ⚙️ Installation Steps

### 1. Install Node.js

**Windows/macOS**: Download from https://nodejs.org/  
**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install nodejs npm
```

Verify:
```bash
node --version
npm --version
```

### 2. Install PostgreSQL

**Windows**: https://www.postgresql.org/download/windows/  
**macOS**: `brew install postgresql && brew services start postgresql`  
**Linux**: `sudo apt install postgresql postgresql-contrib && sudo systemctl start postgresql`

Verify:
```bash
psql --version
psql -U postgres
```

### 3. Create Database

```bash
createdb -U postgres restaurant_db
```

Or via psql:
```sql
psql -U postgres
CREATE DATABASE restaurant_db;
```

### 4. Clone Project

```bash
git clone <repository-url>
cd restaurant-backend
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Create Environment File

Create `.env` in project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_DEFAULT_PASSWORD=Admin@123456
```

### 7. Initialize Database

```bash
npm run db:init
```

Expected output:
```
✅ Schema reset complete
✅ Created role: admin
✅ Created role: manager
✅ Created role: staff
✅ Created role: customer
✅ Admin created: admin@restaurant.com
```

### 8. Populate Sample Data

```bash
npm run db:seed
```

Expected output:
```
✅ Created 3 branches
✅ Created 12 users
✅ Created 15 tables
✅ Created 4 categories
✅ Created 10 menu items
✅ Created 3 orders
```

### 9. Start Server

```bash
npm run dev              # Development mode
npm start               # Production mode
```

Expected:
```
🚀 Server running on http://localhost:3000
✅ Database connected
📚 Swagger docs: http://localhost:3000/api-docs
```

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DB_HOST | Yes | localhost | PostgreSQL hostname |
| DB_PORT | Yes | 5432 | PostgreSQL port |
| DB_NAME | Yes | restaurant_db | Database name |
| DB_USER | Yes | postgres | Database user |
| DB_PASSWORD | Yes | - | Database password |
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment mode |
| JWT_SECRET | Yes | - | JWT secret key |
| JWT_EXPIRES_IN | No | 7d | Token expiration |
| ADMIN_DEFAULT_PASSWORD | No | Admin@123456 | Default admin password |

---

## 🔧 Verification Commands

After installation, verify setup:

```bash
# Check Node.js
node -v

# Check npm
npm -v

# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -c "\l" | grep restaurant_db

# Test database connection
npm run db:check

# List tables
npm run db:check
```

---

## 🐛 Common Issues & Solutions

### "psql: command not found"
PostgreSQL not installed or not in PATH
```bash
# macOS
brew install postgresql

# Linux
sudo apt install postgresql-client

# Windows: Add to PATH or use full path to psql
```

### "FATAL: database restaurant_db does not exist"
Create database first:
```bash
createdb -U postgres restaurant_db
npm run db:init
```

### "ECONNREFUSED localhost:5432"
PostgreSQL not running:
```bash
# Start PostgreSQL
sudo systemctl start postgresql     # Linux
brew services start postgresql      # macOS
# Windows: Start from Services or pg_ctl start
```

### "Port 3000 already in use"
Change port in .env:
```env
PORT=3001
```

Or kill process:
```bash
# macOS/Linux
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot find module"
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "JWT_SECRET not set"
Add to .env:
```env
JWT_SECRET=your_secret_key_here_minimum_32_chars
```

### Database authentication fails
Verify PostgreSQL user password:
```bash
psql -U postgres -h localhost
# Enter password when prompted
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Node.js 16+ installed: `node --version`
- [ ] npm 7+ installed: `npm --version`
- [ ] PostgreSQL 12+ running: `psql --version`
- [ ] Database created: `psql -l | grep restaurant_db`
- [ ] .env file created with all variables
- [ ] `npm install` completed successfully
- [ ] `npm run db:init` succeeded
- [ ] `npm run db:seed` succeeded (optional)
- [ ] `npm run dev` starts server
- [ ] API docs accessible: http://localhost:3000/api-docs
- [ ] Can login with admin credentials

---

## 📊 Version Compatibility

| Component | Minimum | Recommended | Tested |
|-----------|---------|-------------|--------|
| Node.js | 16.13.0 | 18.x | 20.x |
| npm | 7.0.0 | 9.x | 10.x |
| PostgreSQL | 12.0 | 14.x | 15.x |
| Express | 5.0.0 | 5.1.0 | 5.1.0 |
| Sequelize | 6.30.0 | 6.37.7 | 6.37.7 |

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Database password is strong
- [ ] .env file is gitignored
- [ ] NODE_ENV set appropriately
- [ ] SSL/HTTPS configured in production
- [ ] Database backups enabled
- [ ] Regular security updates

---

## 🚀 Next Steps

1. Read README.md for API documentation
2. Check database/README.md for database details
3. Test endpoints via Swagger UI
4. Deploy to production when ready

---

**Last Updated:** November 2024  
**Version:** 1.0.0
