import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { evaluateEligibility } from '@tenderguard/shared';
import type { TenderSource } from '@tenderguard/shared';
import type { ProfileInput } from '@tenderguard/shared';
import { ExtractionService } from '../extraction/extraction.service';
import { PrismaService } from '../prisma/prisma.service';
import { WEB_AGENT_PORT, type RawTender, type SearchQuery, type TenderRef, type WebAgentPort } from '../agent/web-agent.port';
import { SearchQueueService } from './search-queue.service';

@Injectable()
export class SearchJobsService implements OnModuleInit {
  private readonly logger = new Logger(SearchJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: SearchQueueService,
    private readonly extraction: ExtractionService,
    @Inject(WEB_AGENT_PORT) private readonly agent: WebAgentPort,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.workSearch((jobId) => this.runJob(jobId));
  }

  async create(userId: string, query: SearchQuery) {
    const profile = await this.prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException({ code: 'PROFILE_REQUIRED', message: 'Save your business profile before searching.' });
    const job = await this.prisma.searchJob.create({ data: { profileId: profile.id, query: JSON.stringify(query) } });
    await this.log(job.id, 'queued', 'Search request accepted and queued.');
    try {
      await this.queue.sendSearch(job.id);
    } catch (error) {
      await this.prisma.searchJob.update({ where: { id: job.id }, data: { status: 'FAILED', finishedAt: new Date() } });
      throw error;
    }
    return { jobId: job.id };
  }

  async getForUser(userId: string, jobId: string) {
    const job = await this.prisma.searchJob.findFirst({
      where: { id: jobId, profile: { userId } },
      include: { logs: { orderBy: { ts: 'asc' } }, tenders: { include: { tender: { include: { requirements: true, verdicts: true } } } } },
    });
    if (!job) throw new NotFoundException({ code: 'SEARCH_JOB_NOT_FOUND', message: 'Search was not found.' });
    const results = job.tenders.map(({ tender }) => ({
      ...tender,
      estimatedValueInr: tender.estimatedValueInr?.toString() ?? null,
      emdInr: tender.emdInr?.toString() ?? null,
      verdict: tender.verdicts.find((item) => item.profileId === job.profileId) ?? null,
    })).sort((left, right) => {
      const rank = { BID: 0, RISKY: 1, DONT_BID: 2 } as const;
      const leftVerdict = left.verdict?.verdict ?? 'RISKY';
      const rightVerdict = right.verdict?.verdict ?? 'RISKY';
      return rank[leftVerdict] - rank[rightVerdict]
        || (right.verdict?.score ?? 0) - (left.verdict?.score ?? 0)
        || (left.closingAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.closingAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    });
    return { ...job, tenders: undefined, results };
  }

  async readEvents(userId: string, jobId: string, after?: Date) {
    return this.prisma.agentLog.findMany({
      where: { jobId, job: { profile: { userId } }, ...(after ? { ts: { gt: after } } : {}) },
      orderBy: { ts: 'asc' },
      take: 100,
    });
  }

  async statusForUser(userId: string, jobId: string) {
    const job = await this.prisma.searchJob.findFirst({ where: { id: jobId, profile: { userId } }, select: { status: true, progress: true } });
    if (!job) throw new NotFoundException({ code: 'SEARCH_JOB_NOT_FOUND', message: 'Search was not found.' });
    return job;
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await this.prisma.searchJob.findUnique({ where: { id: jobId }, include: { profile: true } });
    if (!job) return;
    const input = this.parseSearchQuery(job.query);
    await this.prisma.searchJob.update({ where: { id: jobId }, data: { status: 'RUNNING', progress: 2 } });
    try {
      await this.log(jobId, 'discover', `Looking for public ${input.sources.join(' and ')} notices matching “${input.query}”.`);
      const refs = (await this.agent.discover(input)).slice(0, 10);
      await this.prisma.searchJob.update({ where: { id: jobId }, data: { progress: refs.length === 0 ? 90 : 8 } });
      await this.log(jobId, 'discovered', refs.length ? `Found ${refs.length} public tender page(s).` : 'No matching public tender pages were found.');
      for (let offset = 0; offset < refs.length; offset += 5) {
        const batch = refs.slice(offset, offset + 5);
        await Promise.all(batch.map(async (ref) => {
          try {
            await this.processTender(jobId, job.profile.id, job.profile, ref);
          } catch (error) {
            this.logger.warn(`Tender ${ref.sourceTenderId} failed independently: ${error instanceof Error ? error.message : 'unknown error'}`);
            await this.log(jobId, 'tender_failed', `This tender could not be analyzed; the rest of the search will continue (${ref.sourceTenderId}).`);
          }
        }));
        const progress = Math.min(94, 8 + Math.round(((offset + batch.length) / refs.length) * 84));
        await this.prisma.searchJob.update({ where: { id: jobId }, data: { progress } });
      }
      await this.prisma.searchJob.update({ where: { id: jobId }, data: { status: 'DONE', progress: 100, finishedAt: new Date() } });
      await this.log(jobId, 'complete', `Search complete. ${refs.length} tender page(s) processed.`);
    } catch (error) {
      this.logger.error(`Search job ${jobId} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      await this.prisma.searchJob.update({ where: { id: jobId }, data: { status: 'FAILED', finishedAt: new Date() } });
      await this.log(jobId, 'failed', 'Search could not complete. Your saved profile and other searches are unchanged.');
    }
  }

  private async processTender(jobId: string, profileId: string, dbProfile: { id: string; category: string; state: string; annualTurnoverInr: bigint; experienceYears: number; msmeStatus: 'NONE' | 'MICRO' | 'SMALL' | 'MEDIUM'; certifications: string[]; documentsHeld: string[] }, ref: TenderRef): Promise<void> {
    await this.log(jobId, 'fetch', `Opening public tender page: ${ref.titleHint}`);
    const raw = await this.agent.fetchDetails(ref);
    const hash = createHash('sha256').update(raw.rawText || raw.reason || '').digest('hex');
    const tender = await this.prisma.tender.upsert({
      where: { url: raw.url },
      create: this.toTenderData(raw, hash),
      update: { title: raw.title, rawText: raw.rawText, contentHash: hash, fetchStatus: raw.fetchStatus, lastFetchedAt: new Date(), department: raw.department ?? null, location: raw.location ?? null },
    });
    await this.prisma.searchJobTender.upsert({ where: { jobId_tenderId: { jobId, tenderId: tender.id } }, create: { jobId, tenderId: tender.id }, update: {} });
    if (raw.fetchStatus !== 'OK') {
      await this.log(jobId, raw.fetchStatus === 'NEEDS_MANUAL_STEP' ? 'manual_step' : 'fetch_failed', raw.reason || 'Tender page could not be read.');
      await this.saveUnknownVerdict(tender.id, profileId, raw.fetchStatus === 'NEEDS_MANUAL_STEP' ? 'The portal needs a manual step; eligibility was not assessed.' : 'The public page could not be fetched; eligibility is unknown.');
      return;
    }
    const extraction = await this.extraction.extract(raw.rawText, raw.url, raw.title, raw.fixtureRequirements);
    const requirements = extraction.requirements;
    await this.prisma.$transaction([
      this.prisma.requirement.deleteMany({ where: { tenderId: tender.id } }),
      ...(requirements.length ? [this.prisma.requirement.createMany({ data: requirements.map((item) => ({ ...item, tenderId: tender.id, valueJson: item.valueJson as Prisma.InputJsonValue })) })] : []),
    ]);
    await this.log(jobId, 'extract', `Extracted ${requirements.length} requirement(s) from source text${extraction.unknownCount ? `; ${extraction.unknownCount} clause(s) need manual verification` : ''}.`);
    const profile: ProfileInput = {
      category: dbProfile.category,
      state: dbProfile.state,
      annualTurnoverInr: Number(dbProfile.annualTurnoverInr),
      experienceYears: dbProfile.experienceYears,
      msmeStatus: dbProfile.msmeStatus,
      certifications: dbProfile.certifications,
      documentsHeld: dbProfile.documentsHeld,
    };
    const closingAt = extraction.closingAt ?? (raw.closingAt ? new Date(raw.closingAt) : null);
    const result = evaluateEligibility(profile, requirements, raw.rawText, closingAt, extraction.unknownCount);
    if (result.reasons.some((reason) => reason.requirement.type === 'EMD')) {
      // EMD risk is already represented by its verified requirement clause.
    } else if (raw.emdInr !== undefined && raw.emdInr !== null) {
      await this.log(jobId, 'emd_unverified', 'The page lists an EMD amount, but no verified source clause was extracted; confirm it manually.');
    }
    await this.prisma.verdict.upsert({
      where: { tenderId_profileId: { tenderId: tender.id, profileId } },
      create: { tenderId: tender.id, profileId, verdict: result.verdict, score: result.score, reasons: result.reasons as unknown as Prisma.InputJsonValue, checklist: result.checklist as unknown as Prisma.InputJsonValue },
      update: { verdict: result.verdict, score: result.score, reasons: result.reasons as unknown as Prisma.InputJsonValue, checklist: result.checklist as unknown as Prisma.InputJsonValue, createdAt: new Date() },
    });
    await this.log(jobId, 'verdict', `Verdict: ${result.verdict} (${result.score}/100).`);
  }

  private toTenderData(raw: RawTender, hash: string): Prisma.TenderCreateInput {
    return {
      source: raw.source,
      sourceTenderId: raw.sourceTenderId,
      url: raw.url,
      title: raw.title,
      department: raw.department ?? null,
      location: raw.location ?? null,
      estimatedValueInr: raw.estimatedValueInr === undefined || raw.estimatedValueInr === null ? null : BigInt(raw.estimatedValueInr),
      emdInr: raw.emdInr === undefined || raw.emdInr === null ? null : BigInt(raw.emdInr),
      publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
      closingAt: raw.closingAt ? new Date(raw.closingAt) : null,
      rawText: raw.rawText,
      contentHash: hash,
      fetchStatus: raw.fetchStatus,
    };
  }

  private async saveUnknownVerdict(tenderId: string, profileId: string, message: string): Promise<void> {
    const reasons = [{ requirementId: null, status: 'UNKNOWN', explanation: message }];
    await this.prisma.verdict.upsert({
      where: { tenderId_profileId: { tenderId, profileId } },
      create: { tenderId, profileId, verdict: 'RISKY', score: 0, reasons, checklist: [] },
      update: { verdict: 'RISKY', score: 0, reasons, checklist: [], createdAt: new Date() },
    });
  }

  private async log(jobId: string, step: string, detail: string): Promise<void> {
    await this.prisma.agentLog.create({ data: { jobId, step, detail } });
  }

  private parseSearchQuery(value: string): SearchQuery {
    try {
      const result = JSON.parse(value) as { query?: string; sources?: TenderSource[] };
      return { query: result.query ?? value, sources: result.sources?.length ? result.sources : ['CPPP', 'GEM'] };
    } catch {
      return { query: value, sources: ['CPPP', 'GEM'] };
    }
  }
}
