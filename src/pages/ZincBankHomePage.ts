import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The ZincBank homepage (https://zincbank.cydeo.io/).
 *
 * The marketing homepage exposes its primary navigation tabs (Personal,
 * Business, Cards, Company) inside a `navigation` landmark with the accessible
 * name "Primary". ZincBank has no `data-test` attributes on this page, so
 * locators use getByRole and are scoped to the smallest stable container (the
 * primary nav) — the footer also contains a "Cards" link, so scoping matters.
 */
export class ZincBankHomePage extends BasePage {
  public readonly primaryNav: Locator = this.page.getByRole('navigation', { name: 'Primary' });

  public constructor(page: ZincBankHomePage['page']) {
    super(page);
  }

  public override async waitForReady(): Promise<void> {
    await this.primaryNav.waitFor({ state: 'visible' });
  }

  /** Opens the ZincBank homepage. */
  public async open(): Promise<void> {
    await this.goto('/');
  }

  /** Returns the tab link locator for the given tab name (e.g. "Personal"). */
  public tab(name: string): Locator {
    return this.primaryNav.getByRole('link', { name, exact: true });
  }

  /** Clicks the named tab link. */
  public async clickTab(name: string): Promise<void> {
    await this.tab(name).click();
  }
}
