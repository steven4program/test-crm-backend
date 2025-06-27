# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **NestJS-based CRM backend** that implements a simple Customer Relationship Management system with role-based access control (RBAC). The application supports two user roles: **Admin** (full CRUD access) and **Viewer** (read-only access).

**Key Features:**
- JWT-based authentication with role-based authorization
- Customer management (CRUD operations)
- User management (Admin-only)
- MySQL database with raw SQL queries
- RESTful API design
- Default admin user seeding on startup

## Architecture

The application follows NestJS's modular architecture:
- **Controllers**: Handle HTTP requests/responses for auth, users, and customers
- **Services**: Contain business logic and database interactions using raw SQL
- **Modules**: Group related controllers and providers (AuthModule, UserModule, CustomerModule)
- **Guards**: Implement JWT authentication and role-based authorization

**Database**: MySQL with two main entities:
- **User**: id, username, password (hashed), role (admin/viewer)
- **Customer**: id, name, email, phone

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run start:dev    # Start in watch mode
npm run start        # Start normally
npm run start:debug  # Start with debugging
```

### Building
```bash
npm run build        # Build for production
npm run start:prod   # Run production build
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
```

### Code Quality
```bash
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

## API Endpoints Structure

**Authentication:**
- `POST /auth/login` - Login and get JWT token (public)
- `POST /auth/logout` - Logout (optional)

**User Management (Admin-only):**
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

**Customer Management:**
- `GET /customers` - List customers (Admin/Viewer)
- `GET /customers/{id}` - Get customer details (Admin/Viewer)
- `POST /customers` - Create customer (Admin-only)
- `PUT /customers/{id}` - Update customer (Admin-only)
- `DELETE /customers/{id}` - Delete customer (Admin-only)

## Security Implementation

- Passwords are hashed using bcrypt before storage
- JWT tokens contain user ID, username, and role
- Auth Guard validates Bearer tokens on protected endpoints
- Roles Guard enforces admin-only access where required
- Default admin credentials: username "admin", password "Admin@123"

## Database Connection

The application uses raw SQL queries with MySQL via the `mysql2` package. Database configuration is handled through environment variables (host, port, credentials, database name).

## Deployment

- Containerized with Docker for deployment on Zeabur
- Environment variables for database connection and JWT secret
- CORS enabled for frontend integration
- Port configured via `process.env.PORT`

## Testing Strategy

The project implements three levels of testing:
- **Unit Tests**: Test individual services and controllers in isolation
- **Integration Tests**: Test module interactions including database operations
- **E2E Tests**: Test complete user flows and API endpoints

## ESLint Configuration

Custom ESLint rules are configured:
- `@typescript-eslint/no-explicit-any`: disabled
- `@typescript-eslint/no-floating-promises`: warning
- `@typescript-eslint/no-unsafe-argument`: warning