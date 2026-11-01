import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('uses safe local defaults when no values are supplied', () => {
    const env = parseEnv({});

    expect(env.AGENT_MODE).toBe('fixture');
    expect(env.LLM_PROVIDER).toBe('gemini');
    expect(env.API_PORT).toBe(4000);
  });

  it('rejects unsupported agent modes', () => {
    expect(() => parseEnv({ AGENT_MODE: 'production' })).toThrow();
  });
});
