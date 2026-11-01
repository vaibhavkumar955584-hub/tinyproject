import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function getPgBoss(): any {
  try {
    return Function('m', 'return require(m)')('pg-boss');
  } catch {
    return null;
  }
}

@Injectable()
export class SearchQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchQueueService.name);
  private boss?: any;
  private inMemoryHandler?: (jobId: string) => Promise<void>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const PgBossClass = getPgBoss();
    const connectionString = this.config.get<string>('DATABASE_URL_UNPOOLED')
      ?? this.config.get<string>('DATABASE_URL');
    if (!PgBossClass || !connectionString) {
      this.logger.warn('pg-boss is unavailable or DATABASE_URL not set; using direct in-memory execution fallback');
      return;
    }
    try {
      this.boss = new PgBossClass(connectionString);
      this.boss.on('error', (error: any) => this.logger.error(`pg-boss: ${error.message}`));
      await this.boss.start();
      await this.boss.createQueue('search.run');
      await this.boss.createQueue('watch.check');
    } catch (err: any) {
      this.logger.warn(`pg-boss failed to initialize (${err.message}); falling back to in-memory execution`);
      this.boss = undefined;
    }
  }

  async sendSearch(jobId: string): Promise<void> {
    if (this.boss) {
      try {
        const id = await this.boss.send('search.run', { jobId });
        if (id) return;
      } catch (err: any) {
        this.logger.warn(`pg-boss send failed (${err.message}); falling back to in-memory execution`);
      }
    }
    if (this.inMemoryHandler) {
      setImmediate(() => {
        this.inMemoryHandler!(jobId).catch((e: any) => this.logger.error(`In-memory search execution error: ${e.message}`));
      });
      return;
    }
    throw new ServiceUnavailableException({ code: 'QUEUE_UNAVAILABLE', message: 'Search queue is not ready.' });
  }

  async workSearch(handler: (jobId: string) => Promise<void>): Promise<void> {
    this.inMemoryHandler = handler;
    if (this.boss) {
      try {
        await this.boss.work('search.run', { batchSize: 1 }, async (jobs: any[]) => {
          await Promise.all(jobs.map((job) => handler(job.data?.jobId ?? job.data)));
        });
      } catch (err: any) {
        this.logger.warn(`pg-boss worker subscription warning: ${err.message}`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.boss?.stop({ graceful: true, timeout: 10_000 });
    } catch {
      // Ignore stop errors on shutdown
    }
  }
}
