import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The ZincBank login page (https://zincbank.cydeo.io/login).
 *
 * ZincBank exposes the login form via accessible labels/roles — the fields have
 * NO `data-test` attributes, so locators use getByLabel / getByRole.
 *
 * The error/validation message renders inside a `role="note"` container
 * (`data-testid="login-error"`). Do NOT use getByRole('alert') for it — the
 * page's only `role="alert"` is the hidden Next.js route announcer (always empty).
 */
export class ZincBankLoginPage extends BasePage {
  public readonly emailInput: Locator = this.page.getByLabel('Email');
  public readonly passwordInput: Locator = this.page.getByLabel('Password');
  public readonly signInButton: Locator = this.page.getByRole('button', { name: 'Sign in' });
  public readonly errorMessage: Locator = this.page.getByRole('note');

  private static readonly BASE_PATH = '/login';

  public async open(): Promise<void> {
    await this.goto(ZincBankLoginPage.BASE_PATH);
    await this.waitForReady();
  }

  public override async waitForReady(): Promise<void> {
    await this.signInButton.waitFor({ state: 'visible' });
  }

  public async signIn(email: string, password: string): Promise<void> {
    // Explicitly clear before filling to avoid stale data
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
