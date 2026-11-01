import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { evaluateEligibility } from '@tenderguard/shared';
import type { TenderSource, ProfileInput, AgentEfficiency, SearchInput, TenderCandidate } from '@tenderguard/shared';
import { ExtractionService } from '../extraction/extraction.service';
import { PrismaService } from '../prisma/prisma.service';
import { WEB_AGENT_PORT, type RawTender, type SearchQuery, type TenderRef, type WebAgentPort } from '../agent/web-agent.port';
import { TinyFishService, humanizeStep } from '../agent/tinyfish.service';
import { ImageService } from '../images/image.service';
import { QueryOptimizerService } from './query-optimizer.service';
import { FanOutService } from './fan-out.service';
import { cpppListGoal } from '../agent/goals/cppp.goal';
import { gemListGoal } from '../agent/goals/gem.goal';
import { SearchQueueService } from './search-queue.service';

const MAX_AGENT_RUNS = 8;
const MAX_TENDERS = 30;
const MAX_DEEP_ANALYZE = 10;
const MAX_JOB_SECONDS = 240;
const CACHE_TTL_HOURS = 6;
const TENDER_CONCURRENCY = 5;

@Injectable()
export class SearchJobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchJobsService.name);
  private readonly cancelledJobs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: SearchQueueService,
    private readonly extraction: ExtractionService,
    private readonly images: ImageService,
    private readonly optimizer: QueryOptimizerService,
    private readonly fanOut: FanOutService,
    @Inject(WEB_AGENT_PORT) private readonly agent: WebAgentPort,
    @Optional() private readonly tinyfish?: TinyFishService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.workSearch((jobId) => this.runJob(jobId));
  }

  async create(userId: string, query: SearchInput) {
    const profile = await this.prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException({ code: 'PROFILE_REQUIRED', message: 'Save your business profile before searching.' });
    }

    const job = await this.prisma.searchJob.create({
      data: {
        profileId: profile.id,
        query: JSON.stringify(query),
        status: 'QUEUED',
        progress: 0,
      },
    });

    await this.log(job.id, 'job.started', JSON.stringify({ jobId: job.id, query: query.query }));
    const sources = query.sources ?? ['CPPP', 'GEM'];
    for (const source of sources) {
      await this.log(job.id, 'portal.status', JSON.stringify({ portal: source, state: 'queued' }));
    }

    try {
      await this.queue.sendSearch(job.id);
    } catch (error) {
      await this.prisma.searchJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      throw error;
    }

    return { jobId: job.id };
  }

  async cancelForUser(userId: string, jobId: string) {
    const job = await this.prisma.searchJob.findFirst({
      where: { id: jobId, profile: { userId } },
      include: { runs: true },
    });
    if (!job) {
      throw new NotFoundException({ code: 'SEARCH_JOB_NOT_FOUND', message: 'Search was not found.' });
    }

    this.cancelledJobs.add(jobId);

    // Cancel all active TinyFish runs
    if (this.tinyfish && job.runs?.length) {
      for (const run of job.runs) {
        if (run.status === 'RUNNING' || run.status === 'PENDING') {
          void this.tinyfish.cancel(run.runId);
        }
      }
    }

    await this.prisma.searchJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    });

    await this.log(jobId, 'job.cancelled', JSON.stringify({ jobId }));
    return { cancelled: true, jobId };
  }

  async getForUser(userId: string, jobId: string) {
    const job = await this.prisma.searchJob.findFirst({
      where: { id: jobId, profile: { userId } },
      include: {
        logs: { orderBy: { ts: 'asc' } },
        runs: true,
        tenders: {
          include: {
            tender: {
              include: { requirements: true, verdicts: true },
            },
          },
        },
      },
    });
    if (!job) {
      throw new NotFoundException({ code: 'SEARCH_JOB_NOT_FOUND', message: 'Search was not found.' });
    }

    const results = job.tenders
      .map(({ tender }) => ({
        ...tender,
        estimatedValueInr: tender.estimatedValueInr?.toString() ?? null,
        emdInr: tender.emdInr?.toString() ?? null,
        verdict: tender.verdicts.find((item) => item.profileId === job.profileId) ?? null,
        image: this.images.resolveImage(tender),
        relevance: tender.relevance ?? 50,
        whyMatched: tender.whyMatched ?? 'Verified tender notice match',
        alsoOn: tender.alsoOn ?? [],
        portalId: tender.portalId || tender.source,
      }))
      .sort((left, right) => {
        const rank = { BID: 0, RISKY: 1, DONT_BID: 2 } as const;
        const leftVerdict = left.verdict?.verdict ?? 'RISKY';
        const rightVerdict = right.verdict?.verdict ?? 'RISKY';
        return (
          rank[leftVerdict] - rank[rightVerdict] ||
          (right.verdict?.score ?? 0) - (left.verdict?.score ?? 0) ||
          (left.closingAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (right.closingAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
        );
      });

    return { ...job, tenders: undefined, results };
  }

  async readEvents(userId: string, jobId: string, after?: Date) {
    return this.prisma.agentLog.findMany({
      where: {
        jobId,
        job: { profile: { userId } },
        ...(after ? { ts: { gt: after } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: 100,
    });
  }

  async statusForUser(userId: string, jobId: string) {
    const job = await this.prisma.searchJob.findFirst({
      where: { id: jobId, profile: { userId } },
      select: { status: true, progress: true, streamingUrl: true },
    });
    if (!job) {
      throw new NotFoundException({ code: 'SEARCH_JOB_NOT_FOUND', message: 'Search was not found.' });
    }
    return job;
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await this.prisma.searchJob.findUnique({
      where: { id: jobId },
      include: { profile: true },
    });
    if (!job || this.cancelledJobs.has(jobId)) return;

    const input = this.parseSearchQuery(job.query);
    const jobStartTime = Date.now();
    let agentRunsCount = 0;
    let fetchCallsCount = 0;
    let searchCallsCount = 0;
    let cachedHitsCount = 0;
    let stepsCount = 0;

    await this.prisma.searchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', progress: 5 },
    });

    try {
      // 1. Optimize query with QueryOptimizerService
      const plan = await this.optimizer.optimize({
        query: input.query,
        category: job.profile?.category,
        state: job.profile?.state,
        turnoverInr: Number(job.profile?.annualTurnoverInr ?? 0),
        msmeStatus: job.profile?.msmeStatus,
      });

      // 2. Select target portals
      const targetPortals = await this.fanOut.selectPortals(plan, input.portals);

      // Emit search.plan event
      await this.log(
        jobId,
        'search.plan',
        JSON.stringify({
          terms: plan.canonicalTerms,
          synonyms: plan.synonyms,
          hindiTerms: plan.hindiTerms,
          portalsChosen: targetPortals.map((p) => p.id),
        }),
      );

      for (const portal of targetPortals) {
        await this.log(jobId, 'portal.status', JSON.stringify({ portal: portal.id, state: 'searching' }));
      }

      // 3. Discovery across selected portals in parallel (Tier 1)
      const rawCandidates: TenderCandidate[] = [];
      const perPortalCounts: Record<string, number> = {};

      await Promise.all(
        targetPortals.map(async (portal) => {
          if (this.cancelledJobs.has(jobId)) return;
          try {
            searchCallsCount += 1;
            const queryForSource: SearchQuery = {
              query: plan.canonicalTerms[0] || input.query,
              sources: [portal.kind as TenderSource],
            };
            const refs = await this.agent.discover(queryForSource);
            perPortalCounts[portal.id] = refs.length;

            for (const ref of refs) {
              rawCandidates.push({
                portalId: portal.id,
                sourceTenderId: ref.sourceTenderId,
                title: ref.titleHint,
                department: ref.department ?? null,
                location: ref.location ?? null,
                closingDate: ref.closingAt ?? null,
                estimatedValueInr: ref.estimatedValueInr ?? null,
                emdInr: ref.emdInr ?? null,
                detailUrl: ref.url,
                discoveredVia: 'search',
                alsoOn: [],
                relevance: 50,
              });
            }

            await this.log(
              jobId,
              'portal.status',
              JSON.stringify({ portal: portal.id, state: 'done', found: refs.length }),
            );
          } catch (err) {
            this.logger.warn(`Portal discovery failed for ${portal.id}: ${err instanceof Error ? err.message : 'unknown'}`);
            await this.log(
              jobId,
              'portal.status',
              JSON.stringify({ portal: portal.id, state: 'blocked', found: 0 }),
            );
          }
        }),
      );

      // 4. Deduplicate candidates across portals and calculate relevance
      const dedupedCandidates = this.fanOut.deduplicateCandidates(rawCandidates);

      const scoredCandidates = dedupedCandidates.map((c) => {
        const { relevance, whyMatched } = this.fanOut.calculateRelevance(c, plan, {
          state: job.profile?.state,
          category: job.profile?.category,
        });
        return { ...c, relevance, whyMatched };
      });

      // Sort by relevance descending
      scoredCandidates.sort((a, b) => b.relevance - a.relevance);

      await this.log(
        jobId,
        'candidates.update',
        JSON.stringify({ count: scoredCandidates.length, perPortal: perPortalCounts }),
      );

      await this.prisma.searchJob.update({
        where: { id: jobId },
        data: { progress: scoredCandidates.length ? 20 : 90 },
      });

      // 5. Parallel Live TinyFish Streaming (Tier 3 demo / preview overlay)
      if (this.tinyfish && scoredCandidates.length > 0 && agentRunsCount < MAX_AGENT_RUNS) {
        const firstCandidate = scoredCandidates[0];
        const primaryPortalId = firstCandidate?.portalId ?? targetPortals[0]?.id ?? 'CPPP';
        const listingUrl =
          firstCandidate?.detailUrl ??
          (primaryPortalId === 'GEM' ? 'https://gem.gov.in/bids' : 'https://eprocure.gov.in/eprocure/app');
        const category = job.profile?.category ?? '';
        const state = job.profile?.state ?? '';
        const goal =
          primaryPortalId === 'GEM'
            ? gemListGoal({ category, state, maxTenders: 5 })
            : cpppListGoal({ category, state, maxTenders: 5 });

        agentRunsCount += 1;

        void (async () => {
          try {
            for await (const ev of this.tinyfish!.run({
              url: listingUrl,
              goal,
              portal: (primaryPortalId === 'GEM' ? 'GEM' : 'CPPP') as TenderSource,
              jobId,
              maxSeconds: 180,
            })) {
              if (this.cancelledJobs.has(jobId)) break;

              if (ev.kind === 'started') {
                await this.log(
                  jobId,
                  'step',
                  JSON.stringify({ portal: primaryPortalId, text: `TinyFish agent dispatched (run ${ev.runId}).` }),
                );
              } else if (ev.kind === 'live') {
                await this.prisma.searchJob.update({
                  where: { id: jobId },
                  data: { streamingUrl: ev.streamingUrl },
                });
                await this.log(
                  jobId,
                  'live.url',
                  JSON.stringify({ portal: primaryPortalId, streamingUrl: ev.streamingUrl }),
                );
              } else if (ev.kind === 'step') {
                stepsCount += 1;
                await this.log(
                  jobId,
                  'step',
                  JSON.stringify({ portal: primaryPortalId, text: ev.text }),
                );
              }
            }
          } catch (err) {
            this.logger.warn(`Live browser stream completed or skipped: ${err instanceof Error ? err.message : 'ok'}`);
          }
        })();
      }

      // 6. Deep analyze top candidates by relevance (up to MAX_DEEP_ANALYZE)
      const topCandidates = scoredCandidates.slice(0, MAX_DEEP_ANALYZE);

      for (let offset = 0; offset < topCandidates.length; offset += TENDER_CONCURRENCY) {
        if (this.cancelledJobs.has(jobId)) break;

        // Check global job timeout budget (240s)
        if ((Date.now() - jobStartTime) / 1000 > MAX_JOB_SECONDS) {
          await this.log(jobId, 'step', JSON.stringify({ portal: 'TenderGuard', text: 'Job budget limit reached (240s). Stopping gracefully.' }));
          break;
        }

        const batch = topCandidates.slice(offset, offset + TENDER_CONCURRENCY);

        await Promise.all(
          batch.map(async (candidate) => {
            if (this.cancelledJobs.has(jobId)) return;
            try {
              fetchCallsCount += 1;
              const ref: TenderRef = {
                source: (candidate.portalId.startsWith('GEM') ? 'GEM' : 'CPPP') as TenderSource,
                sourceTenderId: candidate.sourceTenderId,
                url: candidate.detailUrl,
                titleHint: candidate.title,
                department: candidate.department,
                location: candidate.location,
                estimatedValueInr: candidate.estimatedValueInr,
                emdInr: candidate.emdInr,
                closingAt: candidate.closingDate,
              };

              const { isCached } = await this.processTender(
                jobId,
                job.profile.id,
                job.profile,
                ref,
                {
                  relevance: candidate.relevance,
                  whyMatched: candidate.whyMatched,
                  alsoOn: candidate.alsoOn,
                  portalId: candidate.portalId,
                },
              );
              if (isCached) cachedHitsCount += 1;
            } catch (error) {
              this.logger.warn(`Tender ${candidate.sourceTenderId} failed independently: ${error instanceof Error ? error.message : 'unknown'}`);
              await this.log(
                jobId,
                'tender.blocked',
                JSON.stringify({ tenderId: candidate.sourceTenderId, reason: 'Failed to read public notice.' }),
              );
            }
          }),
        );

        const progress = Math.min(95, 20 + Math.round(((offset + batch.length) / topCandidates.length) * 75));
        await this.prisma.searchJob.update({ where: { id: jobId }, data: { progress } });
      }

      // 7. Wrap up summary and efficiency
      for (const portal of targetPortals) {
        await this.log(jobId, 'portal.status', JSON.stringify({ portal: portal.id, state: 'done' }));
      }

      const efficiency: AgentEfficiency = {
        tendersCount: scoredCandidates.length,
        agentRuns: agentRunsCount,
        fetchCalls: fetchCallsCount,
        searchCalls: searchCallsCount,
        cachedHits: cachedHitsCount,
        stepsUsed: stepsCount,
      };

      await this.log(
        jobId,
        'search.summary',
        JSON.stringify({
          portalsSearched: targetPortals.length,
          candidates: scoredCandidates.length,
          analyzed: topCandidates.length,
          durationMs: Date.now() - jobStartTime,
          tinyfishCalls: { search: searchCallsCount, fetch: fetchCallsCount, agent: agentRunsCount },
        }),
      );

      await this.log(jobId, 'job.summary', JSON.stringify(efficiency));

      await this.prisma.searchJob.update({
        where: { id: jobId },
        data: {
          status: this.cancelledJobs.has(jobId) ? 'CANCELLED' : 'DONE',
          progress: 100,
          finishedAt: new Date(),
        },
      });

      await this.log(
        jobId,
        'job.done',
        JSON.stringify({ jobId, efficiency }),
      );
    } catch (error) {
      this.logger.error(`Search job ${jobId} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      await this.prisma.searchJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      await this.log(jobId, 'job.failed', JSON.stringify({ error: 'Search could not complete.' }));
    } finally {
      this.cancelledJobs.delete(jobId);
    }
  }

  private async processTender(
    jobId: string,
    profileId: string,
    dbProfile: {
      id: string;
      category: string;
      state: string;
      annualTurnoverInr: bigint;
      experienceYears: number;
      msmeStatus: 'NONE' | 'MICRO' | 'SMALL' | 'MEDIUM';
      certifications: string[];
      documentsHeld: string[];
    },
    ref: TenderRef,
    candidateMeta?: {
      relevance?: number;
      whyMatched?: string;
      alsoOn?: string[];
      portalId?: string;
    },
  ): Promise<{ isCached: boolean; verdict?: any }> {
    await this.log(
      jobId,
      'step',
      JSON.stringify({ portal: candidateMeta?.portalId || ref.source, text: `Reading notice: ${ref.titleHint.slice(0, 50)}...` }),
    );

    // Check Cache by URL + TTL
    const existing = await this.prisma.tender.findUnique({
      where: { url: ref.url },
      include: { requirements: true, verdicts: { where: { profileId } } },
    });

    const isFreshCache =
      existing &&
      Date.now() - existing.lastFetchedAt.getTime() < CACHE_TTL_HOURS * 3600 * 1000 &&
      existing.verdicts.length > 0;

    if (isFreshCache && existing.verdicts[0]) {
      await this.prisma.searchJobTender.upsert({
        where: { jobId_tenderId: { jobId, tenderId: existing.id } },
        create: { jobId, tenderId: existing.id },
        update: {},
      });

      const cachedVerdict = existing.verdicts[0];
      const image = this.images.resolveImage(existing);
      await this.log(
        jobId,
        'step',
        JSON.stringify({ portal: candidateMeta?.portalId || ref.source, text: `Reused cached result for ${ref.sourceTenderId}.` }),
      );

      // Emit verdict immediately
      await this.log(
        jobId,
        'tender.verdict',
        JSON.stringify({
          tenderId: existing.id,
          title: existing.title,
          source: existing.source,
          portalId: candidateMeta?.portalId || existing.portalId || existing.source,
          verdict: cachedVerdict.verdict,
          score: cachedVerdict.score,
          relevance: candidateMeta?.relevance ?? existing.relevance ?? 50,
          whyMatched: candidateMeta?.whyMatched ?? existing.whyMatched ?? 'Verified tender notice match',
          alsoOn: candidateMeta?.alsoOn ?? existing.alsoOn ?? [],
          estimatedValueInr: existing.estimatedValueInr?.toString() ?? null,
          emdInr: existing.emdInr?.toString() ?? null,
          closingAt: existing.closingAt?.toISOString() ?? null,
          image,
        }),
      );

      return { isCached: true, verdict: cachedVerdict };
    }

    // Tier 2 Fetch
    const raw = await this.agent.fetchDetails(ref);
    const hash = createHash('sha256').update(raw.rawText || raw.reason || '').digest('hex');

    const tender = await this.prisma.tender.upsert({
      where: { url: raw.url },
      create: {
        ...this.toTenderData(raw, hash),
        portalId: candidateMeta?.portalId || ref.source,
        alsoOn: candidateMeta?.alsoOn || [],
        relevance: candidateMeta?.relevance ?? 50,
        whyMatched: candidateMeta?.whyMatched || null,
      },
      update: {
        title: raw.title,
        rawText: raw.rawText,
        contentHash: hash,
        fetchStatus: raw.fetchStatus,
        lastFetchedAt: new Date(),
        department: raw.department ?? null,
        location: raw.location ?? null,
        portalId: candidateMeta?.portalId || ref.source,
        alsoOn: candidateMeta?.alsoOn || [],
        relevance: candidateMeta?.relevance ?? 50,
        whyMatched: candidateMeta?.whyMatched || null,
      },
    });

    await this.prisma.searchJobTender.upsert({
      where: { jobId_tenderId: { jobId, tenderId: tender.id } },
      create: { jobId, tenderId: tender.id },
      update: {},
    });

    if (raw.fetchStatus !== 'OK') {
      await this.log(
        jobId,
        'tender.blocked',
        JSON.stringify({ tenderId: tender.id, reason: raw.reason ?? 'Needs manual step.' }),
      );
      await this.saveUnknownVerdict(
        tender.id,
        profileId,
        raw.fetchStatus === 'NEEDS_MANUAL_STEP'
          ? 'Portal requires a manual step or login; eligibility was not assessed.'
          : 'Could not fetch public tender notice; eligibility unknown.',
      );
      return { isCached: false };
    }

    // Extraction & Quote Guard
    const extraction = await this.extraction.extract(
      raw.rawText,
      raw.url,
      raw.title,
      raw.fixtureRequirements,
    );
    const requirements = extraction.requirements;

    await this.prisma.$transaction([
      this.prisma.requirement.deleteMany({ where: { tenderId: tender.id } }),
      ...(requirements.length
        ? [
            this.prisma.requirement.createMany({
              data: requirements.map((item) => ({
                ...item,
                tenderId: tender.id,
                valueJson: item.valueJson as Prisma.InputJsonValue,
              })),
            }),
          ]
        : []),
    ]);

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

    const savedVerdict = await this.prisma.verdict.upsert({
      where: { tenderId_profileId: { tenderId: tender.id, profileId } },
      create: {
        tenderId: tender.id,
        profileId,
        verdict: result.verdict,
        score: result.score,
        reasons: result.reasons as unknown as Prisma.InputJsonValue,
        checklist: result.checklist as unknown as Prisma.InputJsonValue,
      },
      update: {
        verdict: result.verdict,
        score: result.score,
        reasons: result.reasons as unknown as Prisma.InputJsonValue,
        checklist: result.checklist as unknown as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });

    const image = this.images.resolveImage(tender);

    // Emit tender verdict event IMMEDIATELY for live UI stream!
    await this.log(
      jobId,
      'tender.verdict',
      JSON.stringify({
        tenderId: tender.id,
        title: tender.title,
        source: tender.source,
        portalId: candidateMeta?.portalId || tender.portalId || tender.source,
        verdict: result.verdict,
        score: result.score,
        relevance: candidateMeta?.relevance ?? 50,
        whyMatched: candidateMeta?.whyMatched ?? 'Keyword match in tender notice',
        alsoOn: candidateMeta?.alsoOn ?? [],
        estimatedValueInr: tender.estimatedValueInr?.toString() ?? null,
        emdInr: tender.emdInr?.toString() ?? null,
        closingAt: tender.closingAt?.toISOString() ?? null,
        reasonsCount: result.reasons.length,
        image,
      }),
    );

    return { isCached: false, verdict: savedVerdict };
  }

  private toTenderData(raw: RawTender, hash: string): Prisma.TenderCreateInput {
    const isDemo = raw.sourceTenderId?.startsWith('DEMO-') || false;
    return {
      source: raw.source,
      sourceTenderId: raw.sourceTenderId,
      url: raw.url,
      title: raw.title,
      department: raw.department ?? null,
      location: raw.location ?? null,
      estimatedValueInr:
        raw.estimatedValueInr === undefined || raw.estimatedValueInr === null
          ? null
          : BigInt(raw.estimatedValueInr),
      emdInr:
        raw.emdInr === undefined || raw.emdInr === null ? null : BigInt(raw.emdInr),
      publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
      closingAt: raw.closingAt ? new Date(raw.closingAt) : null,
      rawText: raw.rawText,
      contentHash: hash,
      fetchStatus: raw.fetchStatus,
      thumbUrl: isDemo ? `/api/images/thumbs/${raw.sourceTenderId.toLowerCase()}.webp` : null,
      imageUrl: isDemo ? `/api/images/full/${raw.sourceTenderId.toLowerCase()}.webp` : null,
      imageSource: isDemo ? 'SCREENSHOT' : null,
      imageCapturedAt: isDemo ? new Date() : null,
      imageWidth: isDemo ? 480 : null,
      imageHeight: isDemo ? 320 : null,
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

  private parseSearchQuery(value: string): SearchInput {
    try {
      const result = JSON.parse(value) as SearchInput;
      return {
        query: result.query ?? value,
        sources: result.sources?.length ? result.sources : ['CPPP', 'GEM'],
        portals: result.portals,
        filters: result.filters,
      };
    } catch {
      return { query: value, sources: ['CPPP', 'GEM'] };
    }
  }
}
