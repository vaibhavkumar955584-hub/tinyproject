import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TendersService {
  constructor(private readonly prisma: PrismaService) {}

  async detail(userId: string, tenderId: string) {
    const profile = await this.prisma.businessProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException({ code: 'PROFILE_REQUIRED', message: 'Save your business profile to view an eligibility analysis.' });
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        requirements: { orderBy: { id: 'asc' } },
        verdicts: { where: { profileId: profile.id }, take: 1 },
        watches: { where: { userId }, take: 1 },
      },
    });
    if (!tender) throw new NotFoundException({ code: 'TENDER_NOT_FOUND', message: 'Tender was not found.' });
    const { verdicts, watches, estimatedValueInr, emdInr, ...rest } = tender;
    return { ...rest, estimatedValueInr: estimatedValueInr?.toString() ?? null, emdInr: emdInr?.toString() ?? null, verdict: verdicts[0] ?? null, watch: watches[0] ?? null };
  }
}
