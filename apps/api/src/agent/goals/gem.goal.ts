import type { PortalGoalParams } from './cppp.goal';

export const gemListGoal = (p: PortalGoalParams): string => `
You are reading a PUBLIC Government e-Marketplace (GeM) bid listing on gem.gov.in.
Read only. Do not log in.

TASK:
1. Locate active public bids for "${p.category}" in or for "${p.state}".
2. Collect up to ${p.maxTenders ?? 10} bids. For each, copy exactly as shown:
   - title
   - tenderId (GeM Bid Number, e.g. GEM/2026/B/...)
   - department or ministry
   - closingDate (Bid End Date/Time)
   - detailUrl (direct link to the bid detail page or PDF)

STRICT SAFETY RULES:
- If a CAPTCHA or bidder login prompt appears, STOP and return {"blocked":"captcha"} or {"blocked":"login"}.
- Never click Participate, Bid, or Register.
- Never invent values. Return null for missing fields.

RETURN JSON ONLY:
{
  "blocked": "none",
  "tenders": [
    {
      "title": "string",
      "tenderId": "string",
      "department": "string",
      "closingDate": "string",
      "detailUrl": "https://..."
    }
  ]
}
`;

export const gemDetailGoal = (): string => `
You are on a PUBLIC GeM bid document or notice page. Read only.

TASK:
Copy the following EXACTLY as written:
- title
- closingDate (Bid End Date / Time)
- emdText (EMD amount, exemption for Micro & Small Enterprises / Startups)
- eligibilityText (Minimum average annual turnover, past experience in years, OEM authorization, MII purchase preference, state office requirement)
- documentLinks (Links to public bid document PDFs)
- pageText (Main text content)

STRICT SAFETY RULES:
- If a login wall appears, return {"blocked":"login"}.
- Never sign in or submit bids.
- Verbatim copy only.

RETURN JSON ONLY:
{
  "blocked": "none",
  "title": "string",
  "closingDate": "string",
  "emdText": "string",
  "eligibilityText": "string",
  "documentLinks": ["https://..."],
  "pageText": "string"
}
`;

