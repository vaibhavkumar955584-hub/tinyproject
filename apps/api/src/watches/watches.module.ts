import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WatchesController } from './watches.controller';
import { WatchesService } from './watches.service';
import { WatchMonitor } from './monitor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentModule } from '../agent/agent.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { DemoCorrigendumController } from './demo-corrigendum.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [AuthModule, PrismaModule, AgentModule, ExtractionModule, NotificationsModule], controllers: [WatchesController, DemoCorrigendumController], providers: [WatchesService, WatchMonitor], exports: [WatchesService] })
export class WatchesModule {}
