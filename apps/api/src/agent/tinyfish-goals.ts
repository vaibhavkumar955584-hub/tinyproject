export const cpppListGoal = (p: { category: string; state: string }): string => `
You are reading a PUBLIC Indian government tender listing. Read only. Do not log in.

TASK
1. Find active tenders related to "${p.category}" in or for "${p.state}".
   Use the site's visible listing or filter controls. If filters are missing,
   scan the first listing pages.
2. Collect at most 10 tenders. For each, copy exactly as shown:
   title, tender ID, department/organisation, closing date, and the link to
   its detail page.

STRICT RULES
- If a CAPTCHA, login wall, or "access denied" appears, STOP immediately and
  return {"blocked":"captcha"} or {"blocked":"login"}. Never try to solve or bypass it.
- Never click Submit, Bid, Register, Download-with-login, or any payment control.
- Never invent values. If a field is not visible, use null.
- Stop after 10 tenders or 40 steps.

RETURN JSON ONLY, no commentary:
{"blocked":"none","tenders":[{"title":"","tenderId":"","department":"",
"closingDate":"","detailUrl":""}]}
`;

export const cpppDetailGoal = (): string => `
You are on a PUBLIC tender detail page. Read only.

TASK
Copy the following EXACTLY as written on the page (do not summarise or rephrase):
- title, closing date / bid submission end date
- EMD / earnest money text
- the complete eligibility / qualification / pre-qualification criteria text
  (turnover, experience, certifications, documents required, MSME or startup
  relaxations if mentioned)
- links to tender documents (PDF) if visible without login
- the main visible page text of the notice

STRICT RULES
- If a CAPTCHA or login wall appears, STOP and return {"blocked":"captcha"} or
  {"blocked":"login"}.
- Never submit, register, or download anything that needs login.
- Copy text verbatim. If something is missing, return null for it.
- Stop after 25 steps.

RETURN JSON ONLY:
{"blocked":"none","title":"","closingDate":"","emdText":"",
"eligibilityText":"","documentLinks":[],"pageText":""}
`;

export const cpppCorrigendumGoal = (): string => `
You are on a PUBLIC tender page. Read only.
Return the current closing date, EMD text, and the full eligibility criteria text
exactly as shown, plus the titles and dates of any corrigendum, addendum or
amendment entries listed. If a CAPTCHA or login appears, STOP and return
{"blocked":"captcha"}. Return JSON only with keys:
blocked, closingDate, emdText, eligibilityText, corrigenda[{title,date}].
`;

export const gemListGoal = (p: { category: string; state: string }): string => `
You are reading a PUBLIC GeM (Government e-Marketplace) bid listing. Read only. Do not log in.

TASK
1. Find active bids related to "${p.category}" in or for "${p.state}".
   Use the site's visible listing or filter controls. If filters are missing,
   scan the first listing pages.
2. Collect at most 10 bids. For each, copy exactly as shown:
   title, bid ID, department/organisation, closing date, and the link to
   its detail page.

STRICT RULES
- If a CAPTCHA, login wall, or "access denied" appears, STOP immediately and
  return {"blocked":"captcha"} or {"blocked":"login"}. Never try to solve or bypass it.
- Never click Submit, Bid, Register, Download-with-login, or any payment control.
- Never invent values. If a field is not visible, use null.
- Stop after 10 bids or 40 steps.

RETURN JSON ONLY, no commentary:
{"blocked":"none","tenders":[{"title":"","tenderId":"","department":"",
"closingDate":"","detailUrl":""}]}
`;
