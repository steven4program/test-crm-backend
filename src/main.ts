import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MigrationService } from './database/migration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://test-crm-frontend.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configure global prefix for API routes
  app.setGlobalPrefix('api/v1');

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Initialize the app (this will trigger onModuleInit for all services)
  await app.init();

  // Run database migrations and seed default admin after initialization
  const migrationService = app.get(MigrationService);
  try {
    await migrationService.runMigrations();
    await migrationService.seedDefaultAdmin();
  } catch (error) {
    logger.error('Database initialization failed', error);
    // Continue running even if DB is not available for health checks
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
