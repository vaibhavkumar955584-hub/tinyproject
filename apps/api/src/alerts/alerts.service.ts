import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.alert.findMany({ where: { userId }, include: { tender: { select: { id: true, title: true, source: true, url: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
