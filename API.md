# CRM Backend API Documentation

## Base URL
- **Local Development**: `http://localhost:3001/api/v1`
- **Production (Zeabur)**: `https://your-zeabur-app.zeabur.app/api/v1`

## Authentication
Uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control
- **Admin**: Full access to all endpoints
- **Viewer**: Read-only access to customer data, no user management access

---

## Endpoints

### Authentication

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST /auth/logout
Logout user (client-side token invalidation).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### User Management (Admin Only)

#### GET /users
Get all users (excluding passwords).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2025-06-27T12:00:00.000Z",
    "updated_at": "2025-06-27T12:00:00.000Z"
  }
]
```

#### GET /users/:id
Get user by ID.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2025-06-27T12:00:00.000Z",
  "updated_at": "2025-06-27T12:00:00.000Z"
}
```

#### POST /users
Create new user.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "SecurePass123",
  "role": "viewer"
}
```

**Response:**
```json
{
  "id": 2,
  "username": "newuser",
  "role": "viewer",
  "created_at": "2025-06-27T12:00:00.000Z",
  "updated_at": "2025-06-27T12:00:00.000Z"
}
```

#### PUT /users/:id
Update user details.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "username": "updateduser",
  "role": "admin"
}
```

#### DELETE /users/:id
Delete user (cannot delete own account).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:** `204 No Content`

---

### Customer Management

#### GET /customers
Get all customers (Admin and Viewer access).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "address": "123 Main St, City, State",
    "created_at": "2025-06-27T12:00:00.000Z",
    "updated_at": "2025-06-27T12:00:00.000Z"
  }
]
```

#### GET /customers/:id
Get customer by ID (Admin and Viewer access).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /customers
Create new customer (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1987654321",
  "company": "Tech Solutions",
  "address": "456 Oak Ave, City, State"
}
```

#### PUT /customers/:id
Update customer (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### DELETE /customers/:id
Delete customer (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:** `204 No Content`

---

### Health Check

#### GET /health
Check application health status including database connectivity.

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-06-27T07:30:00.000Z"
}
```

#### GET /health/ready
Readiness probe for deployment health checks.

#### GET /health/live
Basic liveness probe.

---

### Root

#### GET /
Simple welcome endpoint.

**Response:**
```
Hello World!
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "username should not be empty",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with ID 123 not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username already exists"
}
```

---

## Data Validation

### User Creation/Update
- `username`: Min 3 characters, required
- `password`: Min 6 characters, required for creation
- `role`: Must be 'admin' or 'viewer', defaults to 'viewer'

### Customer Creation/Update
- `name`: Required, max 100 characters
- `email`: Valid email format, required
- `phone`: Required, max 20 characters
- `company`: Optional, max 100 characters
- `address`: Optional, max 255 characters

---

## Implementation Status

### ✅ Implemented (Phase 1 & 2)
- Authentication (login/logout)
- User management with role-based access
- Customer management with role-based access
- Role guards and authorization
- Health monitoring
- JWT token management
- CORS configuration
- Global validation
- Database operations with raw SQL

### 📋 Planned (Phase 3)
- Comprehensive testing suite
- API rate limiting
- Enhanced error logging
- Performance monitoring
- Advanced search and filtering
- Pagination for large datasets

---

## Usage Examples

### JavaScript/TypeScript

```javascript
// Login
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
});

const { access_token } = await loginResponse.json();

// Get customers (works for both admin and viewer)
const customersResponse = await fetch('http://localhost:3001/api/v1/customers', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// Create user (admin only)
const userResponse = await fetch('http://localhost:3001/api/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    username: 'newuser',
    password: 'SecurePass123',
    role: 'viewer'
  })
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Get all customers
curl -X GET http://localhost:3001/api/v1/customers \
  -H "Authorization: Bearer <your-token>"

# Create customer (admin only)
curl -X POST http://localhost:3001/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp"
  }'
```

---

## Notes

- All endpoints return JSON responses
- Timestamps are in ISO 8601 format
- Passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire in 24 hours by default
- Users cannot delete their own account
- Role-based access is strictly enforced
- Database uses MySQL with connection pooling
- Global validation pipes ensure request data integrity