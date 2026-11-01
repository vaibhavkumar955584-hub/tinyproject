import { Body, Controller, Get, MessageEvent, Param, Post, Query, Req, Sse, UseGuards } from '@nestjs/common';
import { searchInputSchema } from '@tenderguard/shared';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SearchJobsService } from './search-jobs.service';

@Controller('search-jobs')
@UseGuards(AuthGuard)
export class SearchJobsController {
  constructor(private readonly jobs: SearchJobsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.jobs.create(request.user.sub, searchInputSchema.parse(body));
  }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.jobs.getForUser(request.user.sub, id);
  }

  @Sse(':id/events')
  events(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Query('after') after?: string): Observable<MessageEvent> {
    let cursor = after && !Number.isNaN(Date.parse(after)) ? new Date(after) : undefined;
    let stopped = false;
    return new Observable<MessageEvent>((subscriber) => {
      const poll = async (): Promise<void> => {
        if (stopped) return;
        try {
          const logs = await this.jobs.readEvents(request.user.sub, id, cursor);
          for (const log of logs) {
            cursor = log.ts;
            subscriber.next({ id: log.id, type: 'activity', data: log });
          }
          const status = await this.jobs.statusForUser(request.user.sub, id);
          if (status.status === 'DONE' || status.status === 'FAILED') {
            subscriber.next({ type: 'complete', data: { status: status.status, progress: status.progress } });
            subscriber.complete();
            return;
          }
          setTimeout(() => void poll(), 900);
        } catch (error) {
          subscriber.error(error);
        }
      };
      void poll();
      return () => { stopped = true; };
    });
  }
}
