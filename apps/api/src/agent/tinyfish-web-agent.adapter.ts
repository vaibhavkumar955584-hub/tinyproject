import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TenderSource } from '@tenderguard/shared';
import type { RawTender, SearchQuery, TenderRef, WebAgentPort } from './web-agent.port';

interface SearchResponse { results?: Array<{ url?: string; title?: string; snippet?: string; site_name?: string }> }
interface FetchResponse { results?: Array<{ url?: string; final_url?: string; title?: string; text?: string }>; errors?: Array<{ url?: string; error?: string }> }

const allowedSourceHosts: Record<TenderSource, string[]> = {
  CPPP: ['eprocure.gov.in'],
  GEM: ['gem.gov.in'],
};

@Injectable()
export class TinyFishWebAgent implements WebAgentPort {
  private readonly logger = new Logger(TinyFishWebAgent.name);

  constructor(private readonly config: ConfigService) {}

  async discover(input: SearchQuery): Promise<TenderRef[]> {
    const apiKey = this.requireApiKey();
    const refs: TenderRef[] = [];
    for (const source of input.sources) {
      const domain = allowedSourceHosts[source][0];
      if (!domain) continue;
      const endpoint = new URL(this.config.get<string>('TINYFISH_SEARCH_URL', 'https://api.search.tinyfish.ai'));
      endpoint.searchParams.set('query', `${input.query} tender notice ${domain}`);
      endpoint.searchParams.set('include_domains', domain);
      endpoint.searchParams.set('location', 'India');
      const response = await fetch(endpoint, { headers: { 'X-API-Key': apiKey }, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new ServiceUnavailableException({ code: 'PORTAL_SEARCH_FAILED', message: `Tender search failed (${response.status}).` });
      const payload = await response.json() as SearchResponse;
      for (const result of payload.results ?? []) {
        if (!result.url || !this.isAllowedUrl(result.url, source)) continue;
        refs.push({
          source,
          sourceTenderId: this.idFromUrl(result.url),
          url: result.url,
          titleHint: result.title?.trim() || result.snippet?.slice(0, 180) || 'Tender notice',
        });
        if (refs.length >= 10) return refs;
      }
    }
    return refs;
  }

  async fetchDetails(ref: TenderRef): Promise<RawTender> {
    if (!this.isAllowedUrl(ref.url, ref.source)) return { ...ref, title: ref.titleHint, rawText: '', fetchStatus: 'NEEDS_MANUAL_STEP', reason: 'The URL is outside the allowed public procurement portal.' };
    const apiKey = this.requireApiKey();
    const endpoint = this.config.get<string>('TINYFISH_FETCH_URL', 'https://api.fetch.tinyfish.ai');
    let lastError = 'Portal fetch failed.';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'X-API-Key': apiKey, 'content-type': 'application/json' },
          body: JSON.stringify({ urls: [ref.url], format: 'markdown', ttl: 0, links: false }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) throw new Error(`Fetch API returned ${response.status}`);
        const result = await response.json() as FetchResponse;
        const page = result.results?.[0];
        if (!page?.text) {
          lastError = result.errors?.[0]?.error || 'No public tender text was returned.';
          if (this.isManualStep(lastError)) return { ...ref, title: ref.titleHint, rawText: '', fetchStatus: 'NEEDS_MANUAL_STEP', reason: 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.' };
          throw new Error(lastError);
        }
        if (this.isManualStep(page.text)) return { ...ref, title: page.title || ref.titleHint, rawText: '', fetchStatus: 'NEEDS_MANUAL_STEP', reason: 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.' };
        return { ...ref, title: page.title || ref.titleHint, rawText: page.text, fetchStatus: 'OK' };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Portal fetch failed.';
        this.logger.warn(`Public tender fetch attempt ${attempt + 1} failed for ${ref.sourceTenderId}: ${lastError}`);
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
    return { ...ref, title: ref.titleHint, rawText: '', fetchStatus: this.isManualStep(lastError) ? 'NEEDS_MANUAL_STEP' : 'FETCH_FAILED', reason: this.isManualStep(lastError) ? 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.' : 'Could not read this public tender page after 3 attempts.' };
  }

  private requireApiKey(): string {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException({ code: 'TINYFISH_NOT_CONFIGURED', message: 'Live portal search requires a TinyFish API key.' });
    return apiKey;
  }

  private isAllowedUrl(value: string, source: TenderSource): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (allowedSourceHosts[source] ?? []).some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  private idFromUrl(value: string): string {
    const url = new URL(value);
    return url.searchParams.get('tenderId') || url.searchParams.get('bidId') || url.pathname.split('/').filter(Boolean).pop() || url.href;
  }

  private isManualStep(text: string): boolean {
    return /captcha|captcha verification|log\s*in|sign\s*in|bidder login|enter your password|one.?time password/i.test(text);
  }
}
