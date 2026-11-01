import { Controller, ForbiddenException, Param, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('dev/tenders')
@UseGuards(AuthGuard)
export class DemoCorrigendumController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly notifications: NotificationsService) {}

  @Post(':id/simulate-corrigendum')
  async simulate(@Req() request: AuthenticatedRequest, @Param('id') tenderId: string) {
    if (process.env.NODE_ENV === 'production' || this.config.get('AGENT_MODE', 'fixture') !== 'fixture') {
      throw new ForbiddenException({ code: 'DEMO_ONLY', message: 'Corrigendum simulation is available only in fixture mode.' });
    }
    const watch = await this.prisma.watch.findFirst({ where: { tenderId, userId: request.user.sub }, include: { tender: { include: { snapshots: { orderBy: { takenAt: 'desc' }, take: 1 }, verdicts: true } } } });
    if (!watch) throw new NotFoundException({ code: 'WATCH_NOT_FOUND', message: 'Watch this tender before simulating a corrigendum.' });
    const tender = watch.tender;
    const beforeDate = tender.closingAt;
    const afterDate = new Date((beforeDate?.getTime() ?? Date.now()) + 3 * 24 * 60 * 60 * 1000);
    const previous = tender.snapshots[0];
    const beforeFields = previous?.fieldsJson ?? { closingAt: beforeDate?.toISOString() ?? null, emdInr: tender.emdInr?.toString() ?? null };
    const afterFields = { ...(typeof beforeFields === 'object' && beforeFields !== null ? beforeFields : {}), closingAt: afterDate.toISOString() };
    const profile = await this.prisma.businessProfile.findUnique({ where: { userId: request.user.sub }, select: { id: true } });
    const verdict = profile ? tender.verdicts.find((item) => item.profileId === profile.id)?.verdict ?? null : null;
    const { updated, alertId } = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.tender.update({ where: { id: tenderId }, data: { closingAt: afterDate, lastFetchedAt: new Date() } });
      await tx.snapshot.create({ data: { tenderId, contentHash: `${tender.contentHash}:demo-corrigendum:${Date.now()}`, fieldsJson: afterFields as Prisma.InputJsonValue } });
      const alert = await tx.alert.create({ data: { userId: request.user.sub, tenderId, changeType: 'DEADLINE', beforeJson: { closingAt: beforeDate?.toISOString() ?? null }, afterJson: { closingAt: afterDate.toISOString() }, verdictBefore: verdict, verdictAfter: verdict } });
      await tx.watch.update({ where: { id: watch.id }, data: { lastCheckedAt: new Date() } });
      return { updated: changed, alertId: alert.id };
    });
    await this.notifications.notifyAlert(alertId);
    return { ok: true, tenderId, closingAtBefore: beforeDate?.toISOString() ?? null, closingAtAfter: updated.closingAt?.toISOString() ?? null, message: 'Demo deadline corrigendum created. Review the before/after change in Alerts.' };
  }
}
