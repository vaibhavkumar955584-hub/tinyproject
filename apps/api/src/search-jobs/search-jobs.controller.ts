import { Body, Controller, Get, Headers, MessageEvent, Param, Post, Query, Req, Sse, UseGuards } from '@nestjs/common';
import { searchInputSchema } from '@tenderguard/shared';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
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

  @Post(':id/cancel')
  cancel(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.jobs.cancelForUser(request.user.sub, id);
  }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.jobs.getForUser(request.user.sub, id);
  }

  @Sse(':id/events')
  events(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('after') after?: string,
    @Headers('last-event-id') lastEventId?: string,
  ): Observable<MessageEvent> {
    const afterParam = after || lastEventId;
    let cursor = afterParam && !Number.isNaN(Date.parse(afterParam)) ? new Date(afterParam) : undefined;
    let stopped = false;
    let heartbeatTimer: NodeJS.Timeout;

    return new Observable<MessageEvent>((subscriber) => {
      // 15s Heartbeat to keep connection alive
      heartbeatTimer = setInterval(() => {
        if (!stopped) {
          subscriber.next({
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
          });
        }
      }, 15_000);

      const poll = async (): Promise<void> => {
        if (stopped) return;
        try {
          const logs = await this.jobs.readEvents(request.user.sub, id, cursor);
          for (const log of logs) {
            cursor = log.ts;

            let parsedData: unknown = log.detail;
            try {
              parsedData = JSON.parse(log.detail);
            } catch {
              parsedData = { message: log.detail, ts: log.ts };
            }

            subscriber.next({
              id: log.ts.toISOString(),
              type: log.step,
              data: parsedData as string | object,
            });
          }

          const status = await this.jobs.statusForUser(request.user.sub, id);
          if (status.status === 'DONE' || status.status === 'FAILED' || status.status === 'CANCELLED') {
            subscriber.next({
              type: 'complete',
              data: { status: status.status, progress: status.progress },
            });
            clearInterval(heartbeatTimer);
            subscriber.complete();
            return;
          }

          setTimeout(() => void poll(), 750);
        } catch (error) {
          clearInterval(heartbeatTimer);
          subscriber.error(error);
        }
      };

      void poll();

      return () => {
        stopped = true;
        clearInterval(heartbeatTimer);
      };
    });
  }
}
