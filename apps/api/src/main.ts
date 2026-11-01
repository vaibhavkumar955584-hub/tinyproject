import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true });
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
