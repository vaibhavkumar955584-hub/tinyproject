export const corrigendumGoal = (): string => `
You are reading a PUBLIC government procurement corrigendum/update page. Read only.

TASK:
Copy exactly as shown:
- closingDate (Latest revised bid closing date and time)
- emdText (Any revision or clarification on EMD/exemption)
- eligibilityText (Any amendment to turnover, experience, or certifications)
- corrigenda (List of all issued corrigenda/amendments with title and publication date)

STRICT RULES:
- If blocked by CAPTCHA or login, return {"blocked":"captcha"}.
- Return verbatim clauses, no summaries.

RETURN JSON ONLY:
{
  "blocked": "none",
  "closingDate": "string",
  "emdText": "string",
  "eligibilityText": "string",
  "corrigenda": [
    {
      "title": "string",
      "date": "string"
    }
  ]
}
`;

