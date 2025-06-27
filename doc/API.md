# CRM Backend API Documentation

## Base URL
- **Local Development**: `http://localhost:3001/api/v1`
- **Production (Zeabur)**: `https://your-zeabur-app.zeabur.app/api/v1`

## Authentication
Uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

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

**Response:**
```json
{
  "status": "ready"
}
```

#### GET /health/live
Basic liveness probe.

**Response:**
```json
{
  "status": "ok"
}
```

---

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

**Response (Error):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
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

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Data Types

### User Object
```typescript
{
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  created_at?: string;
  updated_at?: string;
}
```

### JWT Payload
```typescript
{
  sub: number;      // User ID
  username: string;
  role: string;
  iat: number;      // Issued at
  exp: number;      // Expires at
}
```

---

## Implementation Status

### ✅ Implemented (Phase 1)
- Authentication (login/logout)
- Health monitoring
- JWT token management
- Database connectivity
- CORS configuration
- Global validation

### 🚧 Pending (Phase 2)
- User management CRUD
- Customer management CRUD
- Role-based access guards
- Input validation DTOs

### 📋 Planned (Phase 3)
- Comprehensive testing
- API rate limiting
- Detailed error logging
- Performance monitoring

---

## Usage Examples

### JavaScript/TypeScript

```javascript
// Login
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
});

const { access_token, user } = await loginResponse.json();

// Use token for authenticated requests
const healthResponse = await fetch('http://localhost:3001/api/v1/health', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Health check
curl -X GET http://localhost:3001/api/v1/health \
  -H "Authorization: Bearer <your-token>"
```

---

## Notes

- All endpoints return JSON responses
- Timestamps are in ISO 8601 format
- Passwords are hashed with bcrypt
- JWT tokens expire in 24 hours by default
- Database uses MySQL with connection pooling
- Global validation pipes ensure request data integrity