import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The ZincBank sign-in page (https://zincbank.cydeo.io/login).
 *
 * Exposes business operations (open, sign in, open account) and stable
 * label/role-based locators per the framework's locator-priority rules.
 * Note: ZincBank uses `data-testid`, but the framework registers `data-test`,
 * so locators deliberately avoid `getByTestId`.
 */
export class ZincSignInPage extends BasePage {
  public readonly emailInput: Locator = this.page.getByLabel('Email');
  public readonly passwordInput: Locator = this.page.getByLabel('Password');
  public readonly signInButton: Locator = this.page.getByRole('button', { name: 'Sign in' });
  public readonly openAccountLink: Locator = this.page.getByRole('link', { name: 'Open an account' });
  public readonly message: Locator = this.page.getByRole('note');

  public constructor(page: ZincSignInPage['page']) {
    super(page);
  }

  public override async waitForReady(): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
  }

  /** Opens the ZincBank login page. */
  public async open(): Promise<void> {
    await this.goto('/login');
  }

  /** Fills the credentials and submits the sign-in form. */
  public async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submit();
  }

  /** Submits the sign-in form without filling fields. */
  public async submit(): Promise<void> {
    await this.signInButton.click();
  }

  /** Clicks the "Open an account" link to reach the account-opening page. */
  public async openAccountPage(): Promise<void> {
    await this.openAccountLink.click();
  }
}
