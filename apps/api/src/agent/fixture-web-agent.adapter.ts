import { Injectable } from '@nestjs/common';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { RawTender, SearchQuery, TenderRef, WebAgentPort } from './web-agent.port';

const fixtureSchema = z.object({
  source: z.enum(['CPPP', 'GEM']),
  sourceTenderId: z.string(),
  url: z.string().url(),
  title: z.string(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  estimatedValueInr: z.number().nullable().optional(),
  emdInr: z.number().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  closingAt: z.string().nullable().optional(),
  requirements: z.array(z.object({ type: z.enum(['TURNOVER', 'EXPERIENCE', 'EMD', 'DOCUMENT', 'LOCATION', 'CERTIFICATION', 'OTHER']), valueJson: z.record(z.string(), z.unknown()), sourceQuote: z.string() })).optional(),
  rawText: z.string(),
});

@Injectable()
export class FixtureWebAgent implements WebAgentPort {
  private readonly fixtureDirectory = path.resolve(process.cwd(), '../../fixtures');

  async discover(input: SearchQuery): Promise<TenderRef[]> {
    const fixtures = await this.loadAll();
    return fixtures
      .filter((fixture) => input.sources.includes(fixture.source))
      .filter((fixture) => {
        const haystack = `${fixture.title} ${fixture.department ?? ''} ${fixture.location ?? ''} ${fixture.rawText}`.toLowerCase();
        const terms = input.query.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
        return terms.length === 0 || terms.some((word) => haystack.includes(word)) || fixture.sourceTenderId.startsWith('DEMO-');
      })
      .slice(0, 10)
      .map(({ source, sourceTenderId, url, title, department, location, estimatedValueInr, emdInr, publishedAt, closingAt }) => ({ source, sourceTenderId, url, titleHint: title, department, location, estimatedValueInr, emdInr, publishedAt, closingAt }));
  }

  async fetchDetails(ref: TenderRef): Promise<RawTender> {
    const fixture = (await this.loadAll()).find((item) => item.sourceTenderId === ref.sourceTenderId && item.source === ref.source);
    if (!fixture) return { ...ref, title: ref.titleHint, rawText: '', fetchStatus: 'FETCH_FAILED', reason: 'No matching tender fixture was found.' };
    return { ...ref, title: fixture.title, rawText: fixture.rawText, fetchStatus: 'OK', department: fixture.department, location: fixture.location, estimatedValueInr: fixture.estimatedValueInr, emdInr: fixture.emdInr, publishedAt: fixture.publishedAt, closingAt: fixture.closingAt, fixtureRequirements: fixture.requirements };
  }

  private async loadAll() {
    const files = await this.findJsonFiles(this.fixtureDirectory);
    const entries = await Promise.all(files.map(async (file) => fixtureSchema.parse(JSON.parse(await readFile(file, 'utf8')))));
    return entries;
  }

  private async findJsonFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return this.findJsonFiles(fullPath);
      return entry.isFile() && entry.name.endsWith('.json') ? [fullPath] : [];
    }));
    return nested.flat();
  }
}
