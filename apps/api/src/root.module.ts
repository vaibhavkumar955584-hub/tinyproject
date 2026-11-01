import { Controller, Get, Module } from '@nestjs/common';
import { resolve } from 'node:path';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { parseEnv } from '@tenderguard/shared';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { SearchJobsModule } from './search-jobs/search-jobs.module';
import { TendersModule } from './tenders/tenders.module';
import { WatchesModule } from './watches/watches.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(): Promise<{ status: 'ok'; database: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [resolve(process.cwd(), '.env.local'), resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env.local'), resolve(process.cwd(), '../../.env')], validate: (config) => parseEnv(config) }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProfileModule,
    SearchJobsModule,
    TendersModule,
    WatchesModule,
    AlertsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
