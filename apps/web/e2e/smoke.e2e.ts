import { expect, test } from '@playwright/test';

test('demo user can search fixture tenders and inspect source evidence', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('demo@tenderguard.local');
  await page.getByLabel('Password').fill('TenderGuardDemo123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/search$/);

  await page.getByRole('button', { name: 'Run agent' }).click();
  const tenderTitle = page.getByRole('heading', { name: /Demo: Managed IT helpdesk/ });
  await expect(tenderTitle).toBeVisible({ timeout: 60_000 });
  await page.getByRole('link', { name: 'View evidence' }).first().click();
  await expect(page).toHaveURL(/\/tenders\/.+/);
  await expect(page.getByRole('heading', { name: 'Tender needs · You have · Status' })).toBeVisible();
  await page.getByRole('button', { name: 'Open quote' }).first().click();
  await expect(page.getByText('Exact source clause')).toBeVisible();
});
