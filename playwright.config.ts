import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'pnpm --filter @tenderguard/api start:dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        AGENT_MODE: 'fixture',
        WEB_ORIGIN: 'http://localhost:3000',
        PORT: '4000',
      },
    },
    {
      command: process.env.CI ? 'pnpm --filter @tenderguard/web start' : 'pnpm --filter @tenderguard/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: 'http://localhost:4000/api',
        PORT: '3000',
      },
    },
  ],
});
