import { expect, test } from '@playwright/test';

test('login and registration offer Google-only authentication', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to TenderGuard' })).toBeVisible();
  await expect(page.getByText('Continue securely with the Google account linked to your workspace.')).toBeVisible();
  await expect(page.getByLabel('Work email')).toHaveCount(0);
  await expect(page.getByLabel('Password')).toHaveCount(0);
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Start with Google' })).toBeVisible();
  await expect(page.getByLabel('Work email')).toHaveCount(0);
  await expect(page.getByLabel('Password')).toHaveCount(0);
});
