import { Page } from '@playwright/test';
import { ZincSignInPage } from '../pages/ZincSignInPage';
import { ZincBankLoginPage } from '../pages/ZincBankLoginPage';

/** All page objects available to a scenario, wired together once per test. */
export interface PageObjects {
  readonly zincSignInPage: ZincSignInPage;
  readonly zincBankLoginPage: ZincBankLoginPage;
}

/** Composes the page objects for a fresh page (dependency injection / fixture). */
export function createPageObjects(page: Page): PageObjects {
  return {
    zincSignInPage: new ZincSignInPage(page),
    zincBankLoginPage: new ZincBankLoginPage(page),
  };
}
