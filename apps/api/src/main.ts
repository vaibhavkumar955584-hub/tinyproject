import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { parseEnv } from '@tenderguard/shared';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { BigIntInterceptor } from './common/bigint.interceptor';
import { AppModule } from './root.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const env = parseEnv();
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new BigIntInterceptor());

  const origins = env.WEB_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  const corsOptions: Record<string, unknown> = {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
  if (env.WEB_ORIGIN_REGEX) {
    corsOptions.origin = [new RegExp(env.WEB_ORIGIN_REGEX), ...origins];
  }
  app.enableCors(corsOptions);

  app.enableShutdownHooks();
  const port = env.PORT;
  await app.listen(port);
  console.log(`TenderGuard API listening on :${port} (${env.NODE_ENV})`);
}

void bootstrap();
