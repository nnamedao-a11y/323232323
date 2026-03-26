import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './modules/users/users.service';
import { AutomationService } from './modules/automation/automation.service';

async function bootstrap() {
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

  // Bootstrap admin user and default automation rules
  const usersService = app.get(UsersService);
  const automationService = app.get(AutomationService);
  
  await usersService.bootstrapAdmin();
  await automationService.bootstrapDefaultRules();

  const port = configService.get('PORT') || 8001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 CRM Backend running on http://0.0.0.0:${port}`);
}

bootstrap();
