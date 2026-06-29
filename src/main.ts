import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Flutter Web client integration
  app.enableCors();

  // Set global API prefix matching Nginx routing
  app.setGlobalPrefix('api');

  // Enable global validation pipe for DTO payload protection
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip non-validated properties
      transform: true, // Auto-transform payloads to matching types
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`SantriQ backend running on port ${port}`);
}
bootstrap();
