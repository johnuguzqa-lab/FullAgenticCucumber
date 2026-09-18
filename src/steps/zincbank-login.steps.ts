import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { config } from '../config/config';
import { CustomWorld } from '../support/world';

Given('I open the ZincBank login page', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincBankLoginPage.open();
  await this.pages.zincBankLoginPage.waitForReady();
});

When('I sign in with my registered email and password', async function (this: CustomWorld): Promise<void> {
  // Add delay to reduce auth rate-limiting impact
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await this.pages.zincBankLoginPage.signIn(config.username, config.password);
  // Wait for the dashboard to load after successful auth
  await this.page.waitForLoadState('networkidle');
});

When(
  'I sign in with email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string): Promise<void> {
    // Add delay to reduce auth rate-limiting impact
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await this.pages.zincBankLoginPage.signIn(email, password);
    // Wait for the error message to appear (API response takes a moment)
    await this.page.waitForLoadState('networkidle');
  },
);

When('I sign in with my registered email and a wrong password', async function (this: CustomWorld): Promise<void> {
  // Add delay to reduce auth rate-limiting impact
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await this.pages.zincBankLoginPage.signIn(config.username, 'WrongPassword123');
  // Wait for the error message to appear
  await this.page.waitForLoadState('networkidle');
});

When('I sign in with my registered email and no password', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincBankLoginPage.signIn(config.username, '');
});

Then('I am redirected to the ZincBank dashboard', async function (this: CustomWorld): Promise<void> {
  // Allow extra time for auth response + page load (auth may be rate-limited)
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
});

Then('the dashboard navigation is displayed', async function (this: CustomWorld): Promise<void> {
  // Verify dashboard is rendered by checking for key UI elements
  await expect(this.page.getByRole('button', { name: /sign out|logout/i })).toBeVisible({ timeout: 10000 });
});

Then(
  'a login error message {string} should be displayed',
  async function (this: CustomWorld, expectedMessage: string): Promise<void> {
    // Wait up to 10s for the error message to appear (API response + rendering)
    await expect(this.pages.zincBankLoginPage.errorMessage).toHaveText(expectedMessage, { timeout: 10000 });
  },
);

Then(
  'a login validation message {string} should be displayed',
  async function (this: CustomWorld, expectedMessage: string): Promise<void> {
    // Validation messages appear immediately (client-side)
    await expect(this.pages.zincBankLoginPage.errorMessage).toHaveText(expectedMessage, { timeout: 5000 });
  },
);

Then('I remain on the login page', async function (this: CustomWorld): Promise<void> {
  await expect(this.page).toHaveURL(/\/login/);
});
