import { Injectable, Logger } from '@nestjs/common';
import type { PortalRegistryEntry } from './registry';
import type { TenderRef, RawTender } from '../web-agent.port';

@Injectable()
export class GepnicAdapter {
  private readonly logger = new Logger(GepnicAdapter.name);

  buildSearchGoal(portal: PortalRegistryEntry, query: string): string {
    return `You are searching ${portal.name} (${portal.baseUrl}) for active public tender notices.
1. Navigate to the public tender search page: ${portal.publicListUrl}
2. Locate the tender search input field or keyword box.
3. Type "${query}" and submit the search.
4. Extract up to 10 active tender rows: title, tender reference ID, department, estimated value in INR, EMD amount, and closing date.
5. If CAPTCHA or bidder login is mandatory to view results, immediately report status BLOCKED.`;
  }

  buildDetailGoal(portal: PortalRegistryEntry, ref: TenderRef): string {
    return `Navigate to ${ref.url} on ${portal.name}.
Extract the official tender document details:
- Exact tender title & procuring department
- Estimated tender value & EMD requirement
- Section 3 / Section 4 "Eligibility Criteria": quotes regarding minimum average annual turnover, past experience in years, mandatory registrations (PAN, GST, MSME, ISO)
- Bid closing deadline & submission instructions.`;
  }

  isDetailUrl(url: string, portal: PortalRegistryEntry): boolean {
    try {
      const parsed = new URL(url);
      const isDomainMatch = portal.domains.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
      if (!isDomainMatch) return false;

      // GePNIC standard detail patterns
      return (
        parsed.searchParams.has('tenderId') ||
        parsed.searchParams.has('page') ||
        parsed.pathname.includes('TenderDetails') ||
        parsed.pathname.includes('viewTender') ||
        parsed.pathname.endsWith('.pdf')
      );
    } catch {
      return false;
    }
  }

  extractSourceTenderId(url: string, rawText?: string): string {
    try {
      const parsed = new URL(url);
      const paramId = parsed.searchParams.get('tenderId') || parsed.searchParams.get('tender');
      if (paramId) return paramId;
    } catch {}

    if (rawText) {
      const match = rawText.match(/Tender\s*(?:ID|Ref(?:erence)?\s*(?:No|Number)?)\s*[:\-]?\s*([A-Za-z0-9_\-\/]{6,35})/i);
      if (match && match[1]) return match[1].trim();
    }

    return `TNDR-${Math.abs(this.hashCode(url))}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
