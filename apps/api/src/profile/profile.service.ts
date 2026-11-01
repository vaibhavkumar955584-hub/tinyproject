import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProfileInput } from '@tenderguard/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException({ code: 'PROFILE_NOT_FOUND', message: 'Complete your business profile to analyze tenders.' });
    return { ...profile, annualTurnoverInr: profile.annualTurnoverInr.toString() };
  }

  async save(userId: string, input: ProfileInput) {
    const profile = await this.prisma.businessProfile.upsert({
      where: { userId },
      create: { ...input, annualTurnoverInr: BigInt(input.annualTurnoverInr), userId },
      update: { ...input, annualTurnoverInr: BigInt(input.annualTurnoverInr) },
    });
    return { ...profile, annualTurnoverInr: profile.annualTurnoverInr.toString() };
  }
}
