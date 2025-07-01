import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Application } from 'express';
import { MigrationService } from '../src/database/migration.service';

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

interface LogoutResponse {
  message: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure the same settings as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Run migrations and seed test data
    const migrationService = app.get(MigrationService);
    await migrationService.runMigrations();
    await migrationService.seedDefaultAdmin();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid admin credentials', () => {
      return request(app.getHttpServer() as Application)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'Admin@123',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as LoginResponse;
          expect(body.access_token).toBeDefined();
          expect(body.user).toMatchObject({
            username: 'admin',
            role: 'admin',
          });
          expect(typeof body.user.id).toBe('number');
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer() as Application)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Invalid credentials');
        });
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer() as Application)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Invalid credentials');
        });
    });

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer() as Application)
        .post('/api/v1/auth/login')
        .send({
          username: '', // Invalid: empty username
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should return success message', () => {
      return request(app.getHttpServer() as Application)
        .post('/api/v1/auth/logout')
        .expect(200)
        .expect((res) => {
          const body = res.body as LogoutResponse;
          expect(body.message).toBe('Logged out successfully');
        });
    });
  });
});
