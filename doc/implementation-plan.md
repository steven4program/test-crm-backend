# CRM Backend Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for the NestJS CRM backend based on the design specifications in `design-doc.md`. The plan is organized into phases with clear priorities and dependencies.

## Implementation Phases

### Phase 1: Foundation Setup (High Priority)

#### 1. Install Required Dependencies
- **Dependencies to install:**
  - `mysql2` - MySQL client for raw SQL queries
  - `@nestjs/jwt` - JWT token generation and verification
  - `@nestjs/passport` - Passport integration for NestJS
  - `passport-jwt` - JWT strategy for Passport
  - `bcrypt` - Password hashing
  - `class-validator` - Request validation decorators
  - `class-transformer` - Object transformation
  - `@types/bcrypt` - TypeScript definitions

#### 2. Database Connection Module
- Create `DatabaseModule` for MySQL connection management
- Configure connection using environment variables
- Implement connection pooling and error handling
- Set up database service for raw SQL query execution

#### 3. Database Schema Creation
- **User Table Schema:**
  ```sql
  CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'viewer') NOT NULL
  );
  ```
- **Customer Table Schema:**
  ```sql
  CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255)
  );
  ```
- Create migration scripts and database initialization

#### 4. Authentication Module Implementation
- Create `AuthModule` with JWT strategy
- Implement `AuthService` for login logic and token generation
- Create `AuthController` with `/auth/login` endpoint
- Set up JWT configuration and secret management
- Implement `JwtAuthGuard` for protecting endpoints

### Phase 2: Core Business Logic (Medium Priority)

#### 5. User Management Module
- Create `UserModule` with service and controller
- Implement `UserService` with raw SQL operations:
  - `findAll()` - Get all users (exclude passwords)
  - `create()` - Create new user with hashed password
  - `update()` - Update user details
  - `delete()` - Delete user (with self-deletion protection)
- Create `UserController` with all CRUD endpoints
- Apply admin-only guards to all user endpoints

#### 6. Customer Management Module
- Create `CustomerModule` with service and controller
- Implement `CustomerService` with raw SQL operations:
  - `findAll()` - Get all customers
  - `findById()` - Get customer by ID
  - `create()` - Create new customer
  - `update()` - Update customer details
  - `delete()` - Delete customer
- Create `CustomerController` with CRUD endpoints
- Apply appropriate role guards (read for all, write for admin only)

#### 7. Role-Based Authorization
- Create `RolesGuard` for role-based access control
- Implement `@Roles()` decorator for endpoint protection
- Create role validation logic in guards
- Apply guards to appropriate endpoints:
  - User management: Admin only
  - Customer write operations: Admin only
  - Customer read operations: Admin and Viewer

#### 8. Data Transfer Objects (DTOs)
- Create validation DTOs for all endpoints:
  - `LoginDto` - Username and password validation
  - `CreateUserDto` - User creation validation
  - `UpdateUserDto` - User update validation
  - `CreateCustomerDto` - Customer creation validation
  - `UpdateCustomerDto` - Customer update validation
- Apply validation decorators using `class-validator`

#### 9. Default Admin User Seeding
- Implement startup service to check for existing admin
- Create default admin user if none exists:
  - Username: "admin"
  - Password: "Admin@123" (hashed)
  - Role: "admin"
- Add seeding logic to application bootstrap

#### 10. Environment Configuration
- Set up `ConfigModule` for environment variable management
- Define required environment variables:
  - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MYSQL_NAME`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `PORT` (for deployment)
- Create configuration validation schema

### Phase 3: Quality Assurance & Deployment (Medium/Low Priority)

#### 11. Unit Testing
- Write unit tests for all services:
  - `AuthService` - Login logic and token generation
  - `UserService` - All CRUD operations with mocked database
  - `CustomerService` - All CRUD operations with mocked database
- Write unit tests for controllers:
  - Test request/response handling
  - Test guard integration
  - Test validation logic

#### 12. Integration Testing
- Set up test database configuration
- Write integration tests for API endpoints:
  - Authentication flow testing
  - User management endpoint testing
  - Customer management endpoint testing
  - Role-based access control testing
- Test database interactions with real MySQL instance

#### 13. CORS Configuration
- Configure CORS settings in `main.ts`
- Allow frontend domain for cross-origin requests
- Set appropriate headers and methods
- Configure for both development and production environments

#### 14. End-to-End Testing
- Set up E2E testing environment
- Write complete user flow tests:
  - Admin login and user management
  - Admin customer CRUD operations
  - Viewer login and read-only access
  - Authorization failure scenarios
- Test with actual HTTP requests to running application

#### 15. Docker Configuration
- Create `Dockerfile` for application containerization
- Create `docker-compose.yml` for local development with MySQL
- Configure environment variables for container deployment
- Set up health checks and proper port configuration
- Prepare for Zeabur deployment

## Implementation Dependencies

### Critical Path
1. Dependencies → Database Setup → Schema Creation → Auth Module
2. Auth Module → User Module → Customer Module
3. Role Guards → Apply to all protected endpoints
4. DTOs → Apply to all controllers

### Parallel Development Opportunities
- Unit tests can be written alongside each module
- Environment configuration can be set up early
- Docker configuration can be prepared independently

## Success Criteria

Each phase completion should meet these criteria:
- All planned features implemented and working
- Code passes linting and formatting checks
- Unit tests achieve >80% coverage
- Integration tests cover all API endpoints
- E2E tests validate complete user workflows
- Application runs successfully in Docker container

## Timeline Estimation

- **Phase 1 (Foundation):** 2-3 days
- **Phase 2 (Core Features):** 3-4 days  
- **Phase 3 (Quality & Deployment):** 2-3 days

**Total Estimated Time:** 7-10 days for complete implementation

## Next Steps

1. Begin with Phase 1, Task 1: Install required dependencies
2. Set up development environment with MySQL database
3. Follow the implementation plan sequentially
4. Test each component thoroughly before moving to the next
5. Maintain code quality and documentation throughout development