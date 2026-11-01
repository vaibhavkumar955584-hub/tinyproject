import { Body, Controller, Post, Query, Req, Sse, UseGuards } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { TinyFishService } from './tinyfish.service';
import { z } from 'zod';

const streamSchema = z.object({
  url: z.string().url(),
  goal: z.string().min(10).max(2000),
  maxSteps: z.coerce.number().int().min(1).max(200).default(60),
  maxSeconds: z.coerce.number().int().min(30).max(900).default(240),
});

const cancelSchema = z.object({ runId: z.string().min(1) });

@Controller('agent')
@UseGuards(AuthGuard)
export class TinyFishController {
  constructor(private readonly agent: TinyFishService) {}

  @Post('stream')
  async stream(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const { url, goal, maxSteps, maxSeconds } = streamSchema.parse(body);
    const events: Array<{ kind: string; [key: string]: unknown }> = [];
    for await (const ev of this.agent.run({ url, goal, maxSteps, maxSeconds })) {
      events.push({ kind: ev.kind, ...(ev.kind === 'started' ? { runId: ev.runId } : {}), ...(ev.kind === 'live' ? { streamingUrl: ev.streamingUrl } : {}), ...(ev.kind === 'step' ? { text: ev.text } : {}), ...(ev.kind === 'done' ? { ok: ev.ok, result: ev.result, error: ev.error } : {}) });
    }
    return { events };
  }

  @Post('cancel')
  cancel(@Body() body: unknown) {
    const { runId } = cancelSchema.parse(body);
    return this.agent.cancel(runId).then(() => ({ ok: true }));
  }

  @Sse('stream-sse')
  streamSse(@Req() request: AuthenticatedRequest, @Query('url') url?: string, @Query('goal') goal?: string): Observable<{ type: string; data: unknown }> {
    return new Observable<{ type: string; data: unknown }>((subscriber) => {
      let stopped = false;
      (async () => {
        try {
          for await (const ev of this.agent.run({ url: url ?? '', goal: goal ?? 'Find tender notices', maxSteps: 60, maxSeconds: 240 })) {
            if (stopped) break;
            subscriber.next({ type: ev.kind, data: ev.kind === 'started' ? { runId: ev.runId } : ev.kind === 'live' ? { streamingUrl: ev.streamingUrl } : ev.kind === 'step' ? { text: ev.text } : { ok: ev.ok, result: ev.result, error: ev.error } });
            if (ev.kind === 'done') break;
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
      return () => { stopped = true; };
    }).pipe(map((ev) => ({ type: ev.type, data: ev.data })));
  }
}
