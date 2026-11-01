import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STATIC_SUGGESTIONS = [
  'CCTV camera surveillance installation',
  'Managed IT helpdesk & endpoint support',
  'LAN networking switches and fiber cabling',
  'Enterprise cloud NOC & data center operations',
  'Railway station IP video surveillance',
  'Facility housekeeping and sanitation services',
  'Security guarding personnel deployment',
  'Road construction and civil repair works',
  'Medical equipment and diagnostic supplies',
  'Solar rooftop power plant EPC contract',
  'Diesel generator annual maintenance contract',
  'Smart city traffic surveillance cameras',
];

@Controller('search')
export class SearchSuggestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('suggest')
  async suggest(@Query('q') q?: string) {
    const query = (q ?? '').trim().toLowerCase();
    if (!query) {
      return { suggestions: STATIC_SUGGESTIONS.slice(0, 6) };
    }

    const matches = STATIC_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query));

    try {
      const recent = await this.prisma.searchJob.findMany({
        select: { query: true },
        distinct: ['query'],
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      for (const item of recent) {
        try {
          const parsed = JSON.parse(item.query);
          const rawQ = parsed.query || '';
          if (rawQ && rawQ.toLowerCase().includes(query) && !matches.includes(rawQ)) {
            matches.push(rawQ);
          }
        } catch {}
      }
    } catch {}

    return { suggestions: matches.slice(0, 8) };
  }
}
