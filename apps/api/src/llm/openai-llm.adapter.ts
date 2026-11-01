import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmPort } from './llm.port';

@Injectable()
export class OpenAiLlmAdapter implements LlmPort {
  constructor(private readonly config: ConfigService) {}

  async generateJson(prompt: string, repairPrompt?: string): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException({ code: 'LLM_NOT_CONFIGURED', message: 'Add an OpenAI API key to enable live tender analysis.' });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: this.config.get<string>('OPENAI_MODEL', 'gpt-6.1-terra'),
        messages: [
          { role: 'system', content: 'Return only a valid JSON object. Do not use markdown fences.' },
          { role: 'user', content: repairPrompt ? `${prompt}\n\n${repairPrompt}` : prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) throw new ServiceUnavailableException({ code: 'LLM_REQUEST_FAILED', message: `OpenAI request failed (${response.status}).` });
    const payload: unknown = await response.json();
    const content = (payload as { choices?: Array<{ message?: { content?: string | null } }> }).choices?.[0]?.message?.content;
    if (!content) throw new ServiceUnavailableException({ code: 'LLM_EMPTY_RESPONSE', message: 'OpenAI returned no structured content.' });
    return content;
  }
}
