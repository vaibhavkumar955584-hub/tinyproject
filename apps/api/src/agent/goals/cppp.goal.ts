export interface PortalGoalParams {
  category: string;
  state: string;
  maxTenders?: number;
}

export const cpppListGoal = (p: PortalGoalParams): string => `
You are reading a PUBLIC Indian Central Public Procurement Portal (CPPP) listing on eprocure.gov.in.
Read only. Do not log in.

TASK:
1. Search or filter for active public tenders related to "${p.category}" in or for "${p.state}".
2. Collect up to ${p.maxTenders ?? 10} tenders. For each tender, copy exactly as shown:
   - title
   - tenderId (e.g. 2026_CPPP_XXXX)
   - department or organisation name
   - closingDate (bid submission end date)
   - detailUrl (direct link to the tender notice)

STRICT SAFETY RULES:
- If a CAPTCHA, login wall, or "access denied" appears, STOP immediately and return {"blocked":"captcha"} or {"blocked":"login"}. Never try to solve or bypass it.
- Never click Submit, Bid, Register, or make any payment.
- Never invent values. If a field is not visible, use null.
- Copy text verbatim, do not summarise.

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

export const cpppDetailGoal = (): string => `
You are on a PUBLIC tender detail page on eprocure.gov.in. Read only.

TASK:
Copy the following EXACTLY as written on the page:
- title
- closingDate (Bid submission closing date and time)
- emdText (Earnest Money Deposit amount, exemption clause for MSME/Startups)
- eligibilityText (Full criteria: turnover requirements, experience years, required certifications, mandatory documents, registrations)
- documentLinks (Links to public tender notice PDFs, NIT, or corrigendum notices)
- pageText (Main visible body text of the tender notice)

STRICT SAFETY RULES:
- If a CAPTCHA, login wall, or access restriction appears, STOP and return {"blocked":"captcha"} or {"blocked":"login"}.
- Never log in, never submit bids, never download anything requiring login.
- Copy text verbatim without rephrasing or inventing numbers. Missing fields must be null.

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

