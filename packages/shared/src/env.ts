import { z } from 'zod';

const cleanDbUrl = (fallback: string) =>
  z
    .string()
    .transform((v) => {
      const trimmed = v?.trim().replace(/^["']|["']$/g, '');
      return trimmed || fallback;
    })
    .default(fallback);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: cleanDbUrl('postgresql://tenderguard:tenderguard_dev@localhost:5432/tenderguard?schema=public'),
  DIRECT_URL: cleanDbUrl('postgresql://tenderguard:tenderguard_dev@localhost:5432/tenderguard?schema=public'),
  DATABASE_URL_UNPOOLED: z.string().optional().transform((v) => v?.trim().replace(/^["']|["']$/g, '')),
  DATABASE_URL_TEST: z.string().optional(),
  KEEP_DB_WARM: z.coerce.boolean().default(false),
  JWT_SECRET: z.string().min(16).default('local-development-secret-change-before-deploy-1234567890'),
  COOKIE_MODE: z.enum(['cross-site', 'same-site', 'none']).default('cross-site'),
  COOKIE_DOMAIN: z.string().optional(),
  WEB_ORIGINS: z.string().default('http://localhost:3000'),
  WEB_ORIGIN_REGEX: z.string().optional(),
  AGENT_MODE: z.enum(['live', 'fixture']).default('fixture'),
  TINYFISH_API_KEY: z.string().optional(),
  TINYFISH_SEARCH_URL: z.string().url().default('https://api.search.tinyfish.ai'),
  TINYFISH_FETCH_URL: z.string().url().default('https://api.fetch.tinyfish.ai'),
  TINYFISH_AGENT_URL: z.string().url().default('https://agent.tinyfish.ai/v1/automation/run-sse'),
  LLM_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  OPENAI_MODEL: z.string().default('gpt-6.1-terra'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('dev@tenderguard.local'),
  ENABLE_DOCS: z.coerce.boolean().default(false),
  ENABLE_DEV_ROUTES: z.coerce.boolean().default(false),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(input);
}
