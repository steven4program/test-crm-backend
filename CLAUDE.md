# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **NestJS-based CRM backend** implementing a Customer Relationship Management system with JWT authentication and role-based access control (RBAC). Currently in **Phase 1 completion** with authentication and database infrastructure fully implemented.

**Implementation Status:**
- ✅ **Phase 1 Complete**: Authentication, database layer, health checks, migrations
- 🚧 **Phase 2 Pending**: User and Customer CRUD modules, role guards, DTOs
- 📋 **Phase 3 Planned**: Comprehensive testing, Docker, deployment optimization

**Current Features:**
- JWT authentication with bcrypt password hashing
- MySQL database with raw SQL queries and connection pooling
- Automatic database migrations and schema management
- Health monitoring with database connectivity checks
- Default admin user seeding
- Global validation pipes and error handling

## Architecture Overview

**Core Architecture Pattern**: NestJS modular design with dependency injection
- **Global Modules**: DatabaseModule (connection pool), ConfigModule (environment)
- **Feature Modules**: AuthModule (implemented), HealthModule (implemented)
- **Pending Modules**: UserModule, CustomerModule (Phase 2)

**Database Layer Architecture**:
- `DatabaseService`: Connection pooling, query execution methods (executeQuery, executeInsert, executeUpdate, executeDelete)
- `MigrationService`: Handles SQL migrations from `src/database/migrations/` directory
- **Migration Files**: `001-create-users-table.sql`, `002-create-customers-table.sql`
- **Automatic Migration**: Runs on application startup, tracks executed migrations

**Authentication Flow**:
- `AuthService`: Login validation, JWT token generation, user verification
- `JwtStrategy`: Passport JWT strategy for token validation
- `JwtAuthGuard`: Protects endpoints requiring authentication
- **Token Structure**: `{ sub: userId, username, role }`

## Development Commands

### Essential Setup
```bash
npm install                    # Install dependencies
cp .env.example .env          # Copy environment template
# Configure .env with your MySQL database settings
```

### Development Server
```bash
npm run start:dev             # Start with hot reload (recommended for development)
npm run start:debug           # Start with debugging enabled
npm run build && npm run start:prod  # Test production build locally
```

### Testing & Quality
```bash
npm run test                  # Run unit tests
npm run test:watch           # Run tests in watch mode
npm run test:cov             # Generate test coverage report
npm run lint                 # ESLint with auto-fix
npm run format               # Prettier code formatting
```

### Database Operations
The application automatically handles database operations on startup:
- Creates migration tracking table
- Runs pending SQL migrations from `src/database/migrations/`
- Seeds default admin user (username: "admin", password: "Admin@123")

## Current API Endpoints (Phase 1)

**Base URL**: `http://localhost:3000/api/v1`

**Health Monitoring:**
- `GET /health` - Application health with database status
- `GET /health/ready` - Readiness check (dependencies validation)
- `GET /health/live` - Basic liveness check

**Authentication (Implemented):**
- `POST /auth/login` - Login with username/password, returns JWT token
- `POST /auth/logout` - Logout (client-side token invalidation)

**Planned Endpoints (Phase 2):**
- User Management: `GET|POST|PUT|DELETE /users` (Admin-only)
- Customer Management: `GET|POST|PUT|DELETE /customers` (Role-based access)

## Environment Configuration

**Required Environment Variables** (copy from `.env.example`):
```bash
# Database (MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=your_username
MYSQL_PASSWORD=your_password
MYSQL_NAME=your_database

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Application
PORT=3000
NODE_ENV=development
```

## Database Architecture Details

**Raw SQL Approach**: Uses `mysql2` with parameterized queries (no ORM)
- Connection pooling with 10 max connections
- Transaction support via `DatabaseService.transaction()`
- Migration tracking in `migrations` table
- Development vs production path resolution for migration files

**Key Database Methods**:
- `executeQuery<T>()` - Generic SELECT queries
- `executeInsert()` - INSERT with insertId return
- `executeUpdate()` - UPDATE with affected rows count
- `executeDelete()` - DELETE with affected rows count

## Application Startup Sequence

1. **Module Initialization**: ConfigModule, DatabaseModule, AuthModule, HealthModule
2. **Database Connection**: Create MySQL connection pool
3. **Migration Execution**: Run pending SQL migrations
4. **Admin User Seeding**: Create default admin if none exists
5. **Server Start**: Listen on configured port with global validation

## Docker & Deployment

**Docker Configuration**:
- `Dockerfile`: Multi-stage build with security best practices
- `docker-compose.yml`: Complete development stack with MySQL
- `.dockerignore`: Optimized build context
- `zeabur.json`: Zeabur platform configuration

**Docker Commands**:
```bash
docker build -t crm-backend .                    # Build image
docker-compose up --build                        # Run complete stack
docker-compose up -d --build                     # Run in background
```

## CI/CD Integration

**GitHub Actions workflows configured**:
- `ci.yml`: Code quality, testing, security audits
- `cd.yml`: Deployment pipeline for Zeabur
- Automatic deployment on main branch push
- Docker-based deployment with Zeabur auto-detection

## Development Notes

**Code Style**: ESLint + Prettier with custom rules
**Testing Framework**: Jest with coverage reporting
**API Testing**: `test-requests.http` file included for manual testing
**Validation**: Global ValidationPipe with class-validator decorators