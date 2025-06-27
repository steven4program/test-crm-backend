import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Configure global prefix for API routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
