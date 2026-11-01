import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmPort } from './llm.port';

@Injectable()
export class GeminiLlmAdapter implements LlmPort {
  constructor(private readonly config: ConfigService) {}

  async generateJson(prompt: string, repairPrompt?: string): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException({ code: 'LLM_NOT_CONFIGURED', message: 'Add a Gemini API key to enable live tender analysis.' });
    const content = repairPrompt ? `${prompt}\n\n${repairPrompt}` : prompt;
    const model = this.config.get<string>('GEMINI_MODEL', 'gemini-3.8-flash');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: content }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    if (!response.ok) throw new ServiceUnavailableException({ code: 'LLM_REQUEST_FAILED', message: `Gemini request failed (${response.status}).` });
    const payload: unknown = await response.json();
    const candidate = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('');
    if (!text) throw new ServiceUnavailableException({ code: 'LLM_EMPTY_RESPONSE', message: 'Gemini returned no structured content.' });
    return text;
  }
}
