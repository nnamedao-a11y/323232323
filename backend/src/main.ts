import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './bootstrap/seed.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  logger.log('🚀 Starting CRM Application...');
  
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Run seed on startup (creates admin user, automation rules, templates)
  const seedService = app.get(SeedService);
  await seedService.seedAll();

  const port = configService.get('PORT') || 8001;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`✅ CRM Backend running on http://0.0.0.0:${port}`);
  logger.log(`📚 API available at http://0.0.0.0:${port}/api`);
  logger.log(`🏥 Health check: http://0.0.0.0:${port}/api/system/health`);
}

bootstrap();
