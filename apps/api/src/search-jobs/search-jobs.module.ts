import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { SearchJobsController } from './search-jobs.controller';
import { SearchJobsService } from './search-jobs.service';
import { SearchQueueService } from './search-queue.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, AgentModule, ExtractionModule],
  controllers: [SearchJobsController],
  providers: [SearchJobsService, SearchQueueService],
})
export class SearchJobsModule {}
