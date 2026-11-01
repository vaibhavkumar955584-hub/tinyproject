import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchJobsController } from './search-jobs.controller';
import { PortalsController } from './portals.controller';
import { SearchSuggestController } from './suggest.controller';
import { SearchJobsService } from './search-jobs.service';
import { SearchQueueService } from './search-queue.service';
import { QueryOptimizerService } from './query-optimizer.service';
import { FanOutService } from './fan-out.service';
import { AuthModule } from '../auth/auth.module';
import { ImagesModule } from '../images/images.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [AuthModule, AgentModule, ExtractionModule, PrismaModule, ImagesModule, LlmModule],
  controllers: [SearchJobsController, PortalsController, SearchSuggestController],
  providers: [SearchJobsService, SearchQueueService, QueryOptimizerService, FanOutService],
  exports: [QueryOptimizerService, FanOutService],
})
export class SearchJobsModule {}
