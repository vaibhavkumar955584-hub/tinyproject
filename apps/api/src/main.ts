import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { parseEnv } from '@tenderguard/shared';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { AppModule } from './root.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const env = parseEnv();
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  const port = env.API_PORT;
  await app.listen(port);
}

void bootstrap();
