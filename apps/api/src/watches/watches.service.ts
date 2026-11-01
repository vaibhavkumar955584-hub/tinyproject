import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.watch.findMany({ where: { userId }, include: { tender: { select: { id: true, title: true, source: true, url: true, closingAt: true, fetchStatus: true } } }, orderBy: [{ active: 'desc' }, { lastCheckedAt: 'asc' }] });
  }

  async create(userId: string, tenderId: string, intervalHours: number) {
    const tender = await this.prisma.tender.findUnique({ where: { id: tenderId }, select: { id: true } });
    if (!tender) throw new NotFoundException({ code: 'TENDER_NOT_FOUND', message: 'Tender was not found.' });
    return this.prisma.watch.upsert({ where: { userId_tenderId: { userId, tenderId } }, create: { userId, tenderId, intervalHours }, update: { intervalHours, active: true } });
  }

  async update(userId: string, watchId: string, active: boolean) {
    const watch = await this.prisma.watch.findFirst({ where: { id: watchId, userId } });
    if (!watch) throw new NotFoundException({ code: 'WATCH_NOT_FOUND', message: 'Watch was not found.' });
    return this.prisma.watch.update({ where: { id: watchId }, data: { active } });
  }

  async remove(userId: string, watchId: string) {
    const watch = await this.prisma.watch.findFirst({ where: { id: watchId, userId }, select: { id: true } });
    if (!watch) throw new NotFoundException({ code: 'WATCH_NOT_FOUND', message: 'Watch was not found.' });
    await this.prisma.watch.delete({ where: { id: watchId } });
    return { ok: true };
  }
}
