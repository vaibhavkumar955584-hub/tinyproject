import { createHash } from 'node:crypto';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { evaluateEligibility } from '@tenderguard/shared';
import type { ProfileInput } from '@tenderguard/shared';
import { ExtractionService } from '../extraction/extraction.service';
import { PrismaService } from '../prisma/prisma.service';
import { WEB_AGENT_PORT, type WebAgentPort } from '../agent/web-agent.port';
import { NotificationsService } from '../notifications/notifications.service';

type TrackedFields = { closingAt: string | null; emdInr: string | null; requirements: Array<{ type: string; valueJson: Record<string, unknown>; sourceQuote: string }> };
type WatchWithRelations = Prisma.WatchGetPayload<{ include: { tender: { include: { requirements: true; verdicts: true } }; user: { include: { profile: true } } } }>;

@Injectable()
export class WatchMonitor {
  private readonly logger = new Logger(WatchMonitor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extraction: ExtractionService,
    private readonly notifications: NotificationsService,
    @Inject(WEB_AGENT_PORT) private readonly agent: WebAgentPort,
  ) {}

  @Cron('*/15 * * * *')
  async checkDueWatches(): Promise<void> {
    const now = Date.now();
    const watches = await this.prisma.watch.findMany({
      where: { active: true }, orderBy: { lastCheckedAt: 'asc' },
      include: { tender: { include: { requirements: true, verdicts: true } }, user: { include: { profile: true } } },
      take: 50,
    });
    for (const watch of watches.filter((item) => !item.lastCheckedAt || now - item.lastCheckedAt.getTime() >= item.intervalHours * 60 * 60_000)) {
      try { await this.checkOne(watch); }
      catch (error) { this.logger.warn(`Watch ${watch.id} failed: ${error instanceof Error ? error.message : 'unknown error'}`); }
    }
  }

  private async checkOne(watch: WatchWithRelations): Promise<void> {
    const tender = watch.tender;
    if (tender.contentHash.includes(':demo-corrigendum:')) {
      await this.prisma.watch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
      return;
    }
    const ref = { source: tender.source, sourceTenderId: tender.sourceTenderId, url: tender.url, titleHint: tender.title };
    const raw = await this.agent.fetchDetails(ref);
    if (raw.fetchStatus !== 'OK') {
      await this.prisma.watch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
      return;
    }
    const extraction = await this.extraction.extract(raw.rawText, raw.url, raw.title, raw.fixtureRequirements);
    const after: TrackedFields = {
      closingAt: extraction.closingAt?.toISOString() ?? raw.closingAt ?? tender.closingAt?.toISOString() ?? null,
      emdInr: extraction.emdInr?.toString() ?? raw.emdInr?.toString() ?? tender.emdInr?.toString() ?? null,
      requirements: extraction.requirements.map(({ type, valueJson, sourceQuote }) => ({ type, valueJson, sourceQuote })),
    };
    const previous = await this.prisma.snapshot.findFirst({ where: { tenderId: tender.id }, orderBy: { takenAt: 'desc' } });
    const before: TrackedFields = previous ? previous.fieldsJson as unknown as TrackedFields : {
      closingAt: tender.closingAt?.toISOString() ?? null,
      emdInr: tender.emdInr?.toString() ?? null,
      requirements: tender.requirements.map(({ type, valueJson, sourceQuote }) => ({ type, valueJson: valueJson as Record<string, unknown>, sourceQuote })),
    };
    if (!previous) await this.prisma.snapshot.create({ data: { tenderId: tender.id, contentHash: tender.contentHash, fieldsJson: before as unknown as Prisma.InputJsonValue } });
    const hash = createHash('sha256').update(raw.rawText).digest('hex');
    if (hash === tender.contentHash) {
      await this.prisma.watch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
      return;
    }
    const changes: Array<{ type: 'DEADLINE' | 'EMD' | 'CONDITION'; before: unknown; after: unknown }> = [];
    if (before.closingAt !== after.closingAt) changes.push({ type: 'DEADLINE', before: before.closingAt, after: after.closingAt });
    if (before.emdInr !== after.emdInr) changes.push({ type: 'EMD', before: before.emdInr, after: after.emdInr });
    if (JSON.stringify(before.requirements) !== JSON.stringify(after.requirements)) changes.push({ type: 'CONDITION', before: before.requirements, after: after.requirements });
    const profileDb = watch.user.profile;
    let verdictBefore: string | null = null;
    let verdictAfter: string | null = null;
    if (profileDb) {
      const currentVerdict = tender.verdicts.find((item) => item.profileId === profileDb.id);
      verdictBefore = currentVerdict?.verdict ?? null;
      const profile: ProfileInput = { category: profileDb.category, state: profileDb.state, annualTurnoverInr: Number(profileDb.annualTurnoverInr), experienceYears: profileDb.experienceYears, msmeStatus: profileDb.msmeStatus, certifications: profileDb.certifications, documentsHeld: profileDb.documentsHeld };
      const evaluated = evaluateEligibility(profile, extraction.requirements, raw.rawText, after.closingAt ? new Date(after.closingAt) : null, extraction.unknownCount);
      verdictAfter = evaluated.verdict;
      await this.prisma.verdict.upsert({ where: { tenderId_profileId: { tenderId: tender.id, profileId: profileDb.id } }, create: { tenderId: tender.id, profileId: profileDb.id, verdict: evaluated.verdict, score: evaluated.score, reasons: evaluated.reasons as unknown as Prisma.InputJsonValue, checklist: evaluated.checklist as unknown as Prisma.InputJsonValue }, update: { verdict: evaluated.verdict, score: evaluated.score, reasons: evaluated.reasons as unknown as Prisma.InputJsonValue, checklist: evaluated.checklist as unknown as Prisma.InputJsonValue } });
    }
    const alertIds = await this.prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      await tx.tender.update({ where: { id: tender.id }, data: { rawText: raw.rawText, contentHash: hash, lastFetchedAt: new Date(), closingAt: after.closingAt ? new Date(after.closingAt) : null, emdInr: after.emdInr ? BigInt(after.emdInr) : null } });
      await tx.requirement.deleteMany({ where: { tenderId: tender.id } });
      if (extraction.requirements.length) await tx.requirement.createMany({ data: extraction.requirements.map((item) => ({ ...item, tenderId: tender.id, valueJson: item.valueJson as Prisma.InputJsonValue })) });
      for (const change of changes) {
        const alert = await tx.alert.create({ data: { userId: watch.userId, tenderId: tender.id, changeType: change.type, beforeJson: { value: change.before } as Prisma.InputJsonValue, afterJson: { value: change.after } as Prisma.InputJsonValue, verdictBefore, verdictAfter } });
        ids.push(alert.id);
      }
      await tx.snapshot.create({ data: { tenderId: tender.id, contentHash: hash, fieldsJson: after as unknown as Prisma.InputJsonValue } });
      await tx.watch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
      return ids;
    });
    await Promise.all(alertIds.map((alertId: string) => this.notifications.notifyAlert(alertId)));
  }
}
