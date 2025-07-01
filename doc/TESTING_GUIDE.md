# Testing Guide for NestJS CRM Backend

This guide provides comprehensive instructions for implementing testing in the NestJS CRM backend project, using the login API as the primary implementation example.

## Testing Stack Overview

### Current Setup
The project already includes the following testing tools:

**Core Testing Framework:**
- **Jest** (v29.7.0) - Main testing framework with TypeScript support
- **@nestjs/testing** (v11.0.1) - NestJS testing utilities for dependency injection
- **supertest** (v7.0.0) - HTTP assertion library for E2E testing
- **ts-jest** (v29.2.5) - TypeScript support for Jest

**Configuration Files:**
- `package.json` - Jest configuration with coverage settings
- `test/jest-e2e.json` - E2E testing configuration

## Testing Architecture

### 1. Unit Tests (.spec.ts files)
- **Location**: Same directory as source files (`src/**/*.spec.ts`)
- **Purpose**: Test individual components, services, and controllers in isolation
- **Tools**: Jest + @nestjs/testing
- **Mock Strategy**: Mock external dependencies (database, external services)

### 2. Integration Tests
- **Location**: `src/**/*.integration.spec.ts` (to be created)
- **Purpose**: Test interaction between multiple components
- **Tools**: Jest + @nestjs/testing with real database connections
- **Database Strategy**: Test database or in-memory database

### 3. End-to-End (E2E) Tests
- **Location**: `test/**/*.e2e-spec.ts`
- **Purpose**: Test complete API workflows from HTTP request to response
- **Tools**: Jest + supertest + @nestjs/testing
- **Database Strategy**: Test database with cleanup between tests

## Implementation Flow

### Phase 1: Unit Testing Setup

#### Step 1: Create Auth Service Unit Tests

Create `src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: jest.Mocked<DatabaseService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    role: 'user' as const,
  };

  beforeEach(async () => {
    // Create mocks
    const mockDatabaseService = {
      executeQuery: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should return access token and user data for valid credentials', async () => {
      // Arrange
      databaseService.executeQuery.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          role: 'user',
        },
      });
      expect(databaseService.executeQuery).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        ['testuser'],
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
        role: 'user',
      });
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      databaseService.executeQuery.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      databaseService.executeQuery.mockResolvedValue([]);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(databaseService.executeQuery).toHaveBeenCalledWith(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        ['testuser'],
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid credentials', async () => {
      // Arrange
      databaseService.executeQuery.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateUser('testuser', 'password123');

      // Assert
      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        role: 'user',
      });
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      databaseService.executeQuery.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validateUser('testuser', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for database errors', async () => {
      // Arrange
      databaseService.executeQuery.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.validateUser('testuser', 'password123');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

#### Step 2: Create Auth Controller Unit Tests

Create `src/auth/auth.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from './interfaces/user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const expectedResponse = {
      access_token: 'mock-jwt-token',
      user: {
        id: 1,
        username: 'testuser',
        role: 'user' as const,
      },
    };

    it('should return access token and user data for valid login', async () => {
      // Arrange
      authService.login.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      // Act
      const result = controller.logout();

      // Assert
      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });

  describe('getProfile', () => {
    const mockRequest = {
      user: { id: 1, username: 'testuser', role: 'user' as const },
    };

    const expectedUser: User = {
      id: 1,
      username: 'testuser',
      role: 'user',
    };

    it('should return user profile', async () => {
      // Arrange
      authService.getProfile.mockResolvedValue(expectedUser);

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(authService.getProfile).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      // Arrange
      authService.getProfile.mockRejectedValue(new UnauthorizedException('User not found'));

      // Act & Assert
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(UnauthorizedException);
      expect(authService.getProfile).toHaveBeenCalledWith(1);
    });
  });
});
```

### Phase 2: E2E Testing Setup

#### Step 3: Create Auth E2E Tests

Create `test/auth.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import * as bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  const testUser = {
    username: 'testuser',
    password: 'Test@123',
    role: 'user',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    
    await app.init();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user).toEqual({
            id: expect.any(Number),
            username: testUser.username,
            role: testUser.role,
          });
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: '', // Invalid: empty username
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(Number),
            username: testUser.username,
            role: testUser.role,
          });
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should return success message', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });
  });

  // Helper functions
  async function setupTestData() {
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    await databaseService.executeQuery(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)',
      [testUser.username, hashedPassword, testUser.role],
    );
  }

  async function cleanupTestData() {
    await databaseService.executeQuery(
      'DELETE FROM users WHERE username = ?',
      [testUser.username],
    );
  }
});
```

### Phase 3: Test Configuration & Scripts

#### Step 4: Update Jest Configuration

Update the E2E test configuration in `test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFilesAfterEnv": ["<rootDir>/test-setup.ts"],
  "collectCoverageFrom": [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.interface.ts",
    "!src/main.ts"
  ],
  "coverageDirectory": "./coverage-e2e"
}
```

#### Step 5: Create Test Setup File

Create `test/test-setup.ts`:

```typescript
// Global test setup
jest.setTimeout(30000); // 30 seconds timeout for E2E tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MYSQL_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.MYSQL_USERNAME = process.env.TEST_DB_USERNAME || 'test';
process.env.MYSQL_PASSWORD = process.env.TEST_DB_PASSWORD || 'test';
process.env.MYSQL_NAME = process.env.TEST_DB_NAME || 'test_crm';
```

## Running Tests

### Command Reference

```bash
# Unit Tests
npm run test                     # Run all unit tests
npm run test:watch              # Run tests in watch mode
npm run test -- --coverage     # Run with coverage report
npm run test -- auth           # Run specific test suite

# E2E Tests
npm run test:e2e               # Run all E2E tests
npm run test:e2e -- --coverage # Run E2E tests with coverage

# Combined Coverage
npm run test:cov               # Unit test coverage
```

### Test Database Setup

For E2E testing, set up a separate test database:

1. Create test database: `test_crm`
2. Set environment variables:
   ```bash
   TEST_DB_HOST=localhost
   TEST_DB_USERNAME=test_user
   TEST_DB_PASSWORD=test_password
   TEST_DB_NAME=test_crm
   ```

## Best Practices

### 1. Test Structure (AAA Pattern)
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the results

### 2. Mocking Strategy
- **Unit Tests**: Mock all external dependencies
- **Integration Tests**: Mock external services, use real database
- **E2E Tests**: Use real implementations with test database

### 3. Test Data Management
- Use factories for consistent test data creation
- Clean up test data after each test
- Use transactions for database tests when possible

### 4. Naming Conventions
- Test files: `*.spec.ts` (unit), `*.e2e-spec.ts` (E2E)
- Test descriptions: Use clear, descriptive names
- Test structure: Group related tests with `describe` blocks

### 5. Coverage Goals
- **Unit Tests**: Aim for 80%+ coverage
- **Critical Paths**: 100% coverage for authentication, authorization
- **Error Handling**: Test all error scenarios

## Next Steps

1. **Implement Database Service Testing**: Create unit tests for database operations
2. **Add Integration Tests**: Test service interactions with real database
3. **Security Testing**: Add tests for JWT validation, password hashing
4. **Performance Testing**: Add load testing for critical endpoints
5. **CI/CD Integration**: Configure automated testing in GitHub Actions

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure test database is running and accessible
2. **JWT Token Issues**: Verify JWT_SECRET is set in test environment
3. **Async Test Failures**: Use proper async/await patterns
4. **Mock Issues**: Ensure mocks are properly reset between tests

### Debug Commands

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="login"

# Run single test file
npm run test -- auth.service.spec.ts

# Verbose output
npm run test -- --verbose
```