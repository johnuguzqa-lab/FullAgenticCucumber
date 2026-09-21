import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I open the ZincBank homepage', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincBankHomePage.open();
  await this.pages.zincBankHomePage.waitForReady();
});

Then(
  'I see the navigation tabs {string}, {string}, {string}, {string}',
  async function (
    this: CustomWorld,
    personal: string,
    business: string,
    cards: string,
    company: string,
  ): Promise<void> {
    for (const tab of [personal, business, cards, company]) {
      await expect(this.pages.zincBankHomePage.tab(tab)).toBeVisible();
    }
  },
);

When('I click the {string} tab', async function (this: CustomWorld, tab: string): Promise<void> {
  await this.pages.zincBankHomePage.clickTab(tab);
});

Then('the URL fragment becomes {string}', async function (this: CustomWorld, fragment: string): Promise<void> {
  const expected = fragment.startsWith('#') ? fragment : `#${fragment}`;
  await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(expected)}$`));
});

/** Escapes regex special characters so user-facing text can be matched literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
