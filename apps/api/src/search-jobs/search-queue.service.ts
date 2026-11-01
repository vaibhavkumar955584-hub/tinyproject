import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';

@Injectable()
export class SearchQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchQueueService.name);
  private boss?: PgBoss;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.boss = new PgBoss(this.config.getOrThrow<string>('DATABASE_URL'));
    this.boss.on('error', (error) => this.logger.error(`pg-boss: ${error.message}`));
    await this.boss.start();
    await this.boss.createQueue('search.run');
    await this.boss.createQueue('watch.check');
  }

  async sendSearch(jobId: string): Promise<void> {
    if (!this.boss) throw new ServiceUnavailableException({ code: 'QUEUE_UNAVAILABLE', message: 'Search queue is not ready.' });
    const id = await this.boss.send('search.run', { jobId });
    if (!id) throw new ServiceUnavailableException({ code: 'QUEUE_REJECTED', message: 'Search could not be queued.' });
  }

  async workSearch(handler: (jobId: string) => Promise<void>): Promise<void> {
    if (!this.boss) throw new ServiceUnavailableException({ code: 'QUEUE_UNAVAILABLE', message: 'Search queue is not ready.' });
    await this.boss.work<{ jobId: string }>('search.run', { batchSize: 1 }, async (jobs) => {
      await Promise.all(jobs.map((job) => handler(job.data.jobId)));
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: true, timeout: 10_000 });
  }
}
