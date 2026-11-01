import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiLlmAdapter } from './gemini-llm.adapter';
import { LLM_PORT } from './llm.port';
import { OpenAiLlmAdapter } from './openai-llm.adapter';

@Module({
  providers: [GeminiLlmAdapter, OpenAiLlmAdapter, {
    provide: LLM_PORT,
    inject: [ConfigService, GeminiLlmAdapter, OpenAiLlmAdapter],
    useFactory: (config: ConfigService, gemini: GeminiLlmAdapter, openAi: OpenAiLlmAdapter) => config.get('LLM_PROVIDER') === 'openai' ? openAi : gemini,
  }],
  exports: [LLM_PORT],
})
export class LlmModule {}
