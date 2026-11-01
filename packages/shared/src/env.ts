import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://tenderguard:tenderguard_dev@localhost:5432/tenderguard?schema=public'),
  JWT_SECRET: z.string().min(32).default('local-development-secret-change-before-deploy'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  AGENT_MODE: z.enum(['live', 'fixture']).default('fixture'),
  LLM_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  OPENAI_MODEL: z.string().default('gpt-6.1-terra'),
  TINYFISH_API_KEY: z.string().optional(),
  TINYFISH_SEARCH_URL: z.string().url().default('https://api.search.tinyfish.ai'),
  TINYFISH_FETCH_URL: z.string().url().default('https://api.fetch.tinyfish.ai'),
  TINYFISH_AGENT_URL: z.string().url().default('https://agent.tinyfish.ai/v1/automation/run-sse'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('dev@tenderguard.local'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(input);
}
