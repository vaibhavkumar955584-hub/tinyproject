import { Injectable, Logger, Optional, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TenderSource } from '@tenderguard/shared';
import type { RawTender, SearchQuery, TenderRef, WebAgentPort } from './web-agent.port';
import { FixtureWebAgent } from './fixture-web-agent.adapter';
import { PORTAL_REGISTRY, findPortalForUrl, getPortalById } from './portals/registry';

interface SearchResponse {
  results?: Array<{ url?: string; title?: string; snippet?: string; site_name?: string }>;
}
interface FetchResponse {
  results?: Array<{ url?: string; final_url?: string; title?: string; text?: string }>;
  errors?: Array<{ url?: string; error?: string }>;
}

@Injectable()
export class TinyFishWebAgent implements WebAgentPort {
  private readonly logger = new Logger(TinyFishWebAgent.name);

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly fixture?: FixtureWebAgent,
  ) {}

  async discover(input: SearchQuery): Promise<TenderRef[]> {
    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) {
      if (this.fixture) return this.fixture.discover(input);
      throw new ServiceUnavailableException({ code: 'TINYFISH_NOT_CONFIGURED', message: 'TinyFish API key not configured.' });
    }

    const refs: TenderRef[] = [];
    const targetPortals = PORTAL_REGISTRY.filter((p) =>
      p.enabled && (input.sources.length === 0 || input.sources.includes(p.kind as TenderSource) || input.sources.includes(p.id as any)),
    );

    try {
      for (const portal of targetPortals.slice(0, 6)) {
        const domain = portal.domains[0];
        if (!domain) continue;

        const endpoint = new URL(this.config.get<string>('TINYFISH_SEARCH_URL', 'https://api.search.tinyfish.ai'));
        endpoint.searchParams.set('query', `${input.query} tender notice ${domain}`);
        endpoint.searchParams.set('include_domains', portal.domains.join(','));
        endpoint.searchParams.set('location', 'India');

        const response = await fetch(endpoint, {
          headers: { 'X-API-Key': apiKey },
          signal: AbortSignal.timeout(15_000),
        });

        if (response.ok) {
          const payload = (await response.json()) as SearchResponse;
          for (const result of payload.results ?? []) {
            if (!result.url || !this.isAllowedUrl(result.url)) continue;
            refs.push({
              source: portal.kind as TenderSource,
              sourceTenderId: this.idFromUrl(result.url),
              url: result.url,
              titleHint: result.title?.trim() || result.snippet?.slice(0, 180) || 'Tender notice',
            });
            if (refs.length >= 25) return refs;
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Live discovery failed: ${err instanceof Error ? err.message : 'unknown'}; falling back to fixtures.`);
    }

    if (refs.length === 0 && this.fixture) {
      this.logger.log('Live portal search returned 0 items; enriching with verified demo fixtures.');
      return this.fixture.discover(input);
    }

    return refs;
  }

  async fetchDetails(ref: TenderRef): Promise<RawTender> {
    if (!this.isAllowedUrl(ref.url, ref.source)) {
      if (this.fixture && ref.sourceTenderId.startsWith('DEMO-')) {
        return this.fixture.fetchDetails(ref);
      }
      return {
        ...ref,
        title: ref.titleHint,
        rawText: '',
        fetchStatus: 'NEEDS_MANUAL_STEP',
        reason: 'The URL is outside the allowed public procurement portal.',
      };
    }

    const apiKey = this.config.get<string>('TINYFISH_API_KEY');
    if (!apiKey) {
      if (this.fixture) return this.fixture.fetchDetails(ref);
      throw new ServiceUnavailableException({ code: 'TINYFISH_NOT_CONFIGURED', message: 'TinyFish API key not configured.' });
    }

    const endpoint = this.config.get<string>('TINYFISH_FETCH_URL', 'https://api.fetch.tinyfish.ai');
    let lastError = 'Portal fetch failed.';

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'X-API-Key': apiKey, 'content-type': 'application/json' },
          body: JSON.stringify({ urls: [ref.url], format: 'markdown', ttl: 21600, links: false }),
          signal: AbortSignal.timeout(20_000),
        });

        if (!response.ok) throw new Error(`Fetch API returned ${response.status}`);
        const result = (await response.json()) as FetchResponse;
        const page = result.results?.[0];

        if (!page?.text) {
          lastError = result.errors?.[0]?.error || 'No public tender text was returned.';
          if (this.isManualStep(lastError)) {
            return {
              ...ref,
              title: ref.titleHint,
              rawText: '',
              fetchStatus: 'NEEDS_MANUAL_STEP',
              reason: 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.',
            };
          }
          throw new Error(lastError);
        }

        if (this.isManualStep(page.text)) {
          return {
            ...ref,
            title: page.title || ref.titleHint,
            rawText: '',
            fetchStatus: 'NEEDS_MANUAL_STEP',
            reason: 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.',
          };
        }

        return { ...ref, title: page.title || ref.titleHint, rawText: page.text, fetchStatus: 'OK' };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Portal fetch failed.';
        this.logger.warn(`Public tender fetch attempt ${attempt + 1} failed for ${ref.sourceTenderId}: ${lastError}`);
      }
    }

    if (this.fixture) {
      this.logger.log(`Falling back to fixture for ${ref.sourceTenderId}`);
      return this.fixture.fetchDetails(ref);
    }

    return {
      ...ref,
      title: ref.titleHint,
      rawText: '',
      fetchStatus: this.isManualStep(lastError) ? 'NEEDS_MANUAL_STEP' : 'FETCH_FAILED',
      reason: this.isManualStep(lastError)
        ? 'Portal requires a CAPTCHA or bidder sign-in. Complete this tender manually.'
        : 'Could not read this public tender page after attempts.',
    };
  }

  private isAllowedUrl(value: string, source?: TenderSource): boolean {
    const portal = findPortalForUrl(value);
    if (!portal) return false;
    if (!source) return true;
    return portal.kind === source || portal.id === (source as string);
  }

  private idFromUrl(value: string): string {
    const url = new URL(value);
    return (
      url.searchParams.get('tenderId') ||
      url.searchParams.get('bidId') ||
      url.pathname.split('/').filter(Boolean).pop() ||
      url.href
    );
  }

  private isManualStep(text: string): boolean {
    return /captcha|captcha verification|log\s*in|sign\s*in|bidder login|enter your password|one.?time password/i.test(text);
  }
}
