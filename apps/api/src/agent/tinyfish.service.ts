import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TenderSource } from '@tenderguard/shared';
import { PrismaService } from '../prisma/prisma.service';

export type AgentEvent =
  | { kind: 'started'; runId: string }
  | { kind: 'live'; streamingUrl: string }
  | { kind: 'step'; text: string; rawPurpose?: string }
  | { kind: 'done'; ok: boolean; result?: unknown; error?: string };

export function humanizeStep(rawPurpose: string): string {
  const p = rawPurpose.toLowerCase();
  if (p.includes('connect') || p.includes('navigat') || p.includes('open') || p.includes('goto')) {
    return 'Opening procurement portal';
  }
  if (p.includes('search') || p.includes('filter') || p.includes('query') || p.includes('input')) {
    return 'Filtering tenders by category & state';
  }
  if (p.includes('list') || p.includes('scan') || p.includes('table') || p.includes('row')) {
    return 'Scanning tender notice listings';
  }
  if (p.includes('turnover') || p.includes('financial') || p.includes('lakh') || p.includes('crore')) {
    return 'Reading annual turnover requirements';
  }
  if (p.includes('experience') || p.includes('years') || p.includes('technical') || p.includes('eligib')) {
    return 'Checking past experience & qualification clauses';
  }
  if (p.includes('emd') || p.includes('earnest') || p.includes('security') || p.includes('msme') || p.includes('exempt')) {
    return 'Verifying EMD amount & MSME exemption clauses';
  }
  if (p.includes('corrigend') || p.includes('amend') || p.includes('extend') || p.includes('date')) {
    return 'Inspecting corrigenda & bid closing deadlines';
  }
  if (p.includes('download') || p.includes('pdf') || p.includes('nit') || p.includes('document')) {
    return 'Reading public notice document text';
  }
  return rawPurpose.length > 80 ? `${rawPurpose.slice(0, 77)}...` : rawPurpose;
}

@Injectable()
export class TinyFishService {
  private readonly logger = new Logger(TinyFishService.name);
  private client: any;
  private RunStatus: any = {};

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    void this.init();
  }

  private async init(): Promise<void> {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) return;
    try {
      const { TinyFish, RunStatus } = await import('@tiny-fish/sdk');
      this.client = new TinyFish({ apiKey, baseURL: 'https://agent.tinyfish.ai/v1' });
      this.RunStatus = RunStatus;
    } catch {
      this.logger.warn('TinyFish SDK import skipped; direct HTTP streaming available.');
    }
  }

  async *run(opts: {
    url: string;
    goal: string;
    maxSteps?: number;
    maxSeconds?: number;
    portal?: TenderSource;
    jobId?: string;
  }): AsyncGenerator<AgentEvent> {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) {
      yield { kind: 'done', ok: false, error: 'TinyFish API key not configured' };
      return;
    }

    let activeRunId: string | undefined;
    const portal = opts.portal ?? 'CPPP';

    // Direct HTTP SSE streaming to avoid any SDK beta-field 403 restrictions
    try {
      const response = await fetch('https://agent.tinyfish.ai/v1/automation/run-sse', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: opts.url,
          goal: opts.goal,
          browser_profile: 'lite',
          agent_config: {
            max_duration_seconds: opts.maxSeconds ?? 240,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.warn(`TinyFish SSE responded with ${response.status}: ${errText}`);
        yield { kind: 'done', ok: false, error: `TinyFish HTTP ${response.status}` };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { kind: 'done', ok: false, error: 'Empty SSE response stream' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const ev = JSON.parse(jsonStr);

            if (ev.type === 'STARTED') {
              activeRunId = ev.run_id;
              if (this.prisma && activeRunId) {
                await this.prisma.tinyFishRun.upsert({
                  where: { runId: activeRunId },
                  create: {
                    runId: activeRunId,
                    portal,
                    goal: opts.goal,
                    status: 'RUNNING',
                    startedAt: new Date(),
                    ...(opts.jobId ? { jobId: opts.jobId } : {}),
                  },
                  update: { status: 'RUNNING' },
                }).catch(() => undefined);
              }
              yield { kind: 'started', runId: ev.run_id };
            } else if (ev.type === 'STREAMING_URL') {
              if (this.prisma && activeRunId) {
                await this.prisma.tinyFishRun.update({
                  where: { runId: activeRunId },
                  data: { streamingUrl: ev.streaming_url },
                }).catch(() => undefined);
              }
              yield { kind: 'live', streamingUrl: ev.streaming_url };
            } else if (ev.type === 'PROGRESS') {
              const friendlyText = humanizeStep(ev.purpose ?? 'Working');
              if (this.prisma && activeRunId) {
                await this.prisma.tinyFishRun.update({
                  where: { runId: activeRunId },
                  data: { stepsCount: { increment: 1 } },
                }).catch(() => undefined);
              }
              yield { kind: 'step', text: friendlyText, rawPurpose: ev.purpose };
            } else if (ev.type === 'COMPLETE') {
              const isOk = ev.status === 'COMPLETED';
              if (this.prisma && activeRunId) {
                await this.prisma.tinyFishRun.update({
                  where: { runId: activeRunId },
                  data: {
                    status: isOk ? 'COMPLETED' : 'FAILED',
                    resultJson: ev.result ?? undefined,
                    errorJson: ev.error ?? undefined,
                    finishedAt: new Date(),
                  },
                }).catch(() => undefined);
              }
              yield {
                kind: 'done',
                ok: isOk,
                result: ev.result,
                error: ev.error?.message,
              };
              return;
            }
          } catch {
            // ignore JSON parse chunk errors
          }
        }
      }
    } catch (error) {
      this.logger.error(`TinyFish streaming error: ${error instanceof Error ? error.message : 'unknown'}`);
      yield { kind: 'done', ok: false, error: error instanceof Error ? error.message : 'stream failed' };
    }
  }

  async cancel(runId: string): Promise<void> {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) return;
    try {
      await fetch(`https://agent.tinyfish.ai/v1/runs/${runId}/cancel`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      if (this.prisma) {
        await this.prisma.tinyFishRun.update({
          where: { runId },
          data: { status: 'CANCELLED', finishedAt: new Date() },
        }).catch(() => undefined);
      }
    } catch (error) {
      this.logger.warn(`Cancel request for run ${runId} failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async fetchStepScreenshot(runId: string, stepId: string): Promise<Buffer | null> {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) return null;
    try {
      const res = await fetch(`https://agent.tinyfish.ai/v1/runs/${runId}/steps/${stepId}/screenshot`, {
        headers: { 'X-API-Key': apiKey },
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
}
