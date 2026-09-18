# Cline Agents — User Guide

### Playwright + TypeScript + Cucumber BDD Framework

#### Examples built against **ZincBank** — `https://zincbank.cydeo.io/login`

This guide explains how to use the **Cline AI-agent toolchain** shipped in this repository
(`.cline/agents/`, `.cline/skills/`, `.cline/workflows/`, `.clinerules/`) to plan, generate,
heal, version-control, and report on BDD tests.

All examples use the **ZincBank** application, a fully-simulated, deterministic bank built by
CYDEO for software-testing education. It is an ideal target: every screen, balance, and
decision is documented and repeatable, which makes agent-generated tests predictable.

---

## Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. The Agent Toolchain at a Glance](#2-the-agent-toolchain-at-a-glance)
- [3. First-Time Setup — Point the Framework at ZincBank](#3-first-time-setup--point-the-framework-at-zincbank)
- [4. How to Invoke an Agent in Cline](#4-how-to-invoke-an-agent-in-cline)
- [5. ZincBank Application Reference (for Agents)](#5-zincbank-application-reference-for-agents)
- [6. Agent Examples — ZincBank](#6-agent-examples--zincbank)
  - [6.1 Planner Agent — Plan a Login feature](#61-planner-agent--plan-a-login-feature)
  - [6.2 Test Generator Agent — Generate the Login feature](#62-test-generator-agent--generate-the-login-feature)
  - [6.3 Healer Agent — Fix a failing test](#63-healer-agent--fix-a-failing-test)
  - [6.4 Git Agents — branch, commit, push, PR](#64-git-agents--branch-commit-push-pr)
  - [6.5 Jira Agents — import & status sync](#65-jira-agents--import--status-sync)
- [7. Built-in Workflows](#7-built-in-workflows)
- [8. Skills Quick Reference](#8-skills-quick-reference)
- [9. Rules & Guardrails](#9-rules--guardrails)
- [10. Reports & Artifacts](#10-reports--artifacts)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before using the agents, make sure the framework runs locally:

| Requirement        | Command                                                         | Notes                                             |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| Node.js >= 20      | `node --version`                                                | 20 LTS or newer                                   |
| Dependencies       | `npm ci`                                                        | Uses `package-lock.json` for reproducible install |
| Playwright browser | `npx playwright install chromium`                               | Chromium is the default browser                   |
| Environment file   | `cp .env.example .env`                                          | Fill in credentials — never commit `.env`         |
| Jira (optional)    | `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT` | Only needed for the Jira agents                   |

Verify the setup works:

```bash
npm run test:dry-run   # validates feature files + step definitions without running
npm run verify         # lint + format:check + typecheck
```

---

## 2. The Agent Toolchain at a Glance

Everything lives under the `.cline/` and `.clinerules/` directories.

### Agents (`.cline/agents/`)

| Agent                  | Folder            | Responsibility                                                                                                                      |
| ---------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Planner**            | `planner/`        | Turns a requirement into a structured BDD test plan after inspecting the live UI; saves it to `specs/` **only after your approval** |
| **Test Generator**     | `test-generator/` | Turns a plan into `.feature` files, step definitions, and Page Objects                                                              |
| **Healer**             | `healer/`         | Diagnoses and fixes failing tests — max 3 attempts, then escalates to you                                                           |
| **Git — Branch**       | `git/`            | Creates correctly named branches; never works on `main` unapproved                                                                  |
| **Git — Commit**       | `git/`            | Reviews diffs, blocks secrets/`.env`, writes Conventional Commits                                                                   |
| **Git — Push**         | `git/`            | Pushes committed work — only with your explicit approval                                                                            |
| **Git — PR**           | `git/`            | Drafts pull requests with real test results and report links                                                                        |
| **Jira Import**        | `jira-import/`    | Imports BDD scenarios into Jira after de-duplication                                                                                |
| **Jira Status Update** | `jira-status/`    | Syncs Jira issue statuses from the latest automation report                                                                         |

### Workflows (`.cline/workflows/`)

| Workflow             | Purpose                                                     | Agents used             |
| -------------------- | ----------------------------------------------------------- | ----------------------- |
| `create-test`        | plan → generate → run → verify (add coverage for a feature) | planner, test-generator |
| `heal-test`          | reproduce → analyze → fix (max 3) → validate                | healer                  |
| `jira-import`        | dry-run first, then import scenarios into Jira              | jira-import             |
| `jira-status-update` | update Jira statuses from the latest report                 | jira-status             |

### Skills (`.cline/skills/`)

`playwright`, `cucumber`, `page-object-model`, `test-design`, `test-healing`, `git`, `jira`,
`reporting`, `environment-management`.

### Rules (`.clinerules/`)

`architecture`, `coding-standards`, `playwright-rules`, `cucumber-rules`, `locator-rules`,
`environment-rules`, `git-rules`, `agent-rules`, `security-rules`, `approval-rules`.

---

## 3. First-Time Setup — Point the Framework at ZincBank

The framework currently ships with **Swag Labs (saucedemo.com)** as the reference app. To use
**ZincBank** as the target, point the environment configs at the ZincBank base URL.

> ⚠️ ZincBank's **login page has no `data-test` attributes** — earlier notes claiming
> `login-email-input` / `login-submit` exist were wrong. Use role/label locators:
> `getByLabel('Email')`, `getByLabel('Password')`, `getByRole('button', { name: 'Sign in' })`,
> and `getByRole('alert')` for the error message. (The framework's global `data-test` test-id
> still applies to Saucedemo and any other app that actually uses `data-test`.)

**Edit `src/config/environments/dev.ts` (and `qa.ts` if you run with `ENV=qa`):**

```ts
import { EnvironmentConfig } from '../../types';

export const devConfig: EnvironmentConfig = {
  name: 'dev',
  baseUrl: 'https://zincbank.cydeo.io', // was https://www.saucedemo.com
};
```

> Tip: you can also override the URL at runtime without touching code via `.env`:
> `BASE_URL=https://zincbank.cydeo.io ENV=dev npm test`.

**`.env` example for ZincBank:**

```dotenv
ENV=dev
BASE_URL=https://zincbank.cydeo.io
BROWSER=chromium
HEADLESS=true
TIMEOUT=30000
WORKERS=1
TRACE=on-first-retry
SCREENSHOT=only-on-failure
VIDEO=off
# ZincBank test account (create one, or use your account):
USERNAME=you@example.com
PASSWORD=your-simulated-password
```

> **Security rule**: never put a real credential in code — only in git-ignored `.env`.
> Run `npm run verify:secrets` before committing.

---

## 4. How to Invoke an Agent in Cline

Cline reads agent definitions from `.cline/agents/`. You can use them in two ways:

1. **By name in the chat.** Start your message with the agent's name, e.g.

   > _Use the planner-agent to plan a ZincBank login feature._

   The agent then follows its own instructions (planning, generating, healing, git, Jira…).

2. **Via the agent picker.** In Cline's Plan/Act UI, agents defined in `.cline/agents/`
   appear in the agent selector. Pick one before sending your message.

**Workflow-style prompts** (recommended for end-to-end tasks) reference the workflow by name:

> _Run the `create-test` workflow: add BDD coverage for the ZincBank login page at
> https://zincbank.cydeo.io/login._

---

## 5. ZincBank Application Reference (for Agents)

ZincBank (`https://zincbank.cydeo.io`) is a **fully-simulated bank** for testing education.
All balances, accounts, and decisions are deterministic. Below are the real elements observed
on the live site — share this with the agents so they generate accurate tests.

> ⚠️ ZincBank is a CYDEO teaching project. It is **not** a real bank and contains no real
> money or financial services. Use simulated credentials only.

### Login page — `https://zincbank.cydeo.io/login`

| Element                      | Accessible name              | Locator (verified)                               | Notes                         |
| ---------------------------- | ---------------------------- | ------------------------------------------------ | ----------------------------- |
| Email field                  | `Email`                      | `getByLabel('Email')`                            | placeholder `you@example.com` |
| Password field               | `Password`                   | `getByLabel('Password')`                         |                               |
| Sign in button               | `Sign in`                    | `getByRole('button', { name: 'Sign in' })`       |                               |
| Link: "Open an account"      | `Open an account`            | `getByRole('link', { name: 'Open an account' })` | goes to `/apply`              |
| Error message (failed login) | `Invalid email or password.` | `getByRole('alert')`                             | only on failed login          |

> ⚠️ ZincBank's login page has **no `data-test` attributes** — do **not** use `getByTestId` here.

Behavior observed:

- Successful sign-in redirects to **`/dashboard`** (title "Dashboard · ZincBank"), showing nav
  (Dashboard, Accounts, Move money, Transactions, Cards, Profile) and heading "Welcome, there".
- Invalid email/password combo shows **"Invalid email or password."** in a `role="alert"`
  element and stays on `/login`.
- The login form uses `novalidate` and no `required` attributes — validation is JS-driven.
  Verified behavior: empty fields, a malformed email, or a valid email with an empty password
  are **silently ignored** (no redirect, no error). Only a well-formed-but-wrong credential
  pair produces the alert.

> Recommended locator strategy (framework locator order): `getByRole` / `getByLabel` —
> `getByLabel('Email')`, `getByLabel('Password')`, `getByRole('button', { name: 'Sign in' })`,
> `getByRole('alert')`. Do **not** use `getByTestId` on the ZincBank login page.

### Home page — `https://zincbank.cydeo.io/`

- Header links: **Log in** (`/login`), **Open account** (`/apply`), plus theme toggle.
- Marketing sections: Checking & Savings, Move money, ZincBank Card, Statements & history.
- Deterministic demo data shown publicly (e.g. Checking `••4291` → `$12,480.55`,
  Savings `••7782` → `$48,200.00`).

### Apply page — `https://zincbank.cydeo.io/apply`

- Multi-step wizard: **Step 1 of 6 · Choose your accounts**.
- Step 1 has checkboxes: **Checking account (always included)** (checked),
  **Open a savings account**, **Joint account (coming soon)** (disabled), and a **Continue**
  button.

### Component kit — `https://zincbank.cydeo.io/kit`

- UI reference: buttons, form controls, status pills, toasts, modals, tables, and money
  formatting. Useful for verifying component-level assertions.

---

## 6. Agent Examples — ZincBank

This section contains **copy-paste prompts** for every agent, each with the expected output
and the files the agent will create or touch. Replace the example credentials and Jira keys
with your own.

---

### 6.1 Planner Agent — Plan a Login feature

**Agent:** `planner-agent` · **Mode:** Plan · **Tools:** Read, Browser, AskUserQuestion

The Planner converts a requirement into a structured BDD test plan. It **inspects the live
application first** (via the browser / Playwright MCP), identifies flows, and reuses existing
steps and Page Objects. It never writes implementation code.

**Example prompt:**

> Use the planner-agent to plan a test suite for the **ZincBank login page**
> (`https://zincbank.cydeo.io/login`).
>
> Requirement: As a ZincBank customer, I want to sign in with my email and password so that I
> can access my accounts. Invalid credentials should show a clear error and prevent access.
>
> Include happy-path, negative, validation, and boundary cases. Inspect the live UI first to
> confirm the real labels and behaviors, and check `src/pages/` and `src/steps/` for anything
> reusable. Assign tags and priorities.

**Expected output (plan format):**

```text
Test Plan
---------
Feature: ZincBank Login

Scenario 1: Successful login with valid credentials
Preconditions: A valid ZincBank account exists (email + password in .env)
Steps:
  Given I open the ZincBank login page
  When I sign in with my registered email and password
  Then I am taken to the ZincBank dashboard
Priority: Critical
Tag: @smoke @critical

Scenario 2: Login with invalid credentials shows an error
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "wrong@example.com" and password "wrongpass"
  Then a login error message "Invalid email or password." should be displayed
Priority: High
Tag: @sanity

Scenario 3: Login with an empty form is blocked
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "" and password ""
  Then I should see a validation message
Priority: Medium
Tag: @regression
```

**What happens next:** the Planner presents the plan and the target path
(`specs/zincbank-login-test-plan.md`) and **asks for your approval before creating the file**
under `specs/`. Once you approve, it saves the plan to `specs/` and hands it to the Test
Generator Agent (see 6.2). The Planner never writes implementation code.

---

### 6.2 Test Generator Agent — Generate the Login feature

**Agent:** `test-generator-agent` · **Mode:** Act · **Tools:** Read, Write, Edit, Bash

The Test Generator turns the planner's test plan into working BDD code, **reusing** existing
Page Objects and step definitions. It writes Gherkin to `features/<area>/<name>.feature`,
thin step definitions to `src/steps/`, and Page Objects to `src/pages/` only when needed.
It then runs the generated test and runs `npm run verify`.

**Example prompt (after the plan from 6.1):**

> Use the test-generator-agent to implement the ZincBank Login test plan:
>
> 1. Create `features/login/zincbank-login.feature` with the scenarios from the plan.
> 2. Create a `ZincBankLoginPage` page object in `src/pages/` (the current `LoginPage.ts` is
>    for Saucedemo — do not overwrite it). Register it in `src/fixtures/pages.ts`.
> 3. Create thin step definitions in `src/steps/` that delegate to the page object.
> 4. Use role/label locators: `getByLabel('Email')`, `getByLabel('Password')`,
>    `getByRole('button', { name: 'Sign in' })`, and `getByRole('alert')` for the error.
>    The ZincBank login page has **no `data-test` attributes** — do not use `getByTestId`.
> 5. Run the new scenarios and fix any obvious issues, then run `npm run verify`.

**Files the agent creates (reference implementation):**

`features/login/zincbank-login.feature`:

```gherkin
@smoke
Feature: ZincBank Login
  As a ZincBank customer
  I want to sign in with my email and password
  So that I can access my accounts

  Background:
    Given I open the ZincBank login page

  @critical
  Scenario: Successful login with valid credentials
    When I sign in with email "<email>" and password "<password>"
    Then I am taken to the ZincBank dashboard

  @sanity
  Scenario Outline: Sign in with invalid credentials shows an error
    When I sign in with email "<email>" and password "<password>"
    Then a login error message "<error>" should be displayed

    Examples:
      | email             | password  | error                        |
      | wrong@example.com | wrongpass | Invalid email or password.   |

    # Note: a malformed email ("not-an-email") or empty fields do NOT produce this error —
    # they are silently ignored (no redirect, no alert). Only well-formed-but-wrong
    # credentials trigger the message above.
```

`src/pages/ZincBankLoginPage.ts` (page object):

```ts
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The ZincBank login page (https://zincbank.cydeo.io/login).
 * ZincBank exposes the login form via accessible labels/roles — it has NO
 * data-test attributes, so locators use getByLabel / getByRole.
 */
export class ZincBankLoginPage extends BasePage {
  public readonly emailInput: Locator = this.page.getByLabel('Email');
  public readonly passwordInput: Locator = this.page.getByLabel('Password');
  public readonly signInButton: Locator = this.page.getByRole('button', { name: 'Sign in' });
  public readonly errorMessage: Locator = this.page.getByRole('alert');

  private static readonly BASE_PATH = '/login';

  public async open(): Promise<void> {
    await this.goto(ZincBankLoginPage.BASE_PATH);
    await this.waitForReady();
  }

  public async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  public async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }
}
```

`src/steps/zincbank-login.steps.ts` (thin steps):

```ts
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I open the ZincBank login page', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincBankLoginPage.open();
});

When(
  'I sign in with email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string): Promise<void> {
    await this.pages.zincBankLoginPage.signIn(email, password);
  },
);

Then('I am taken to the ZincBank dashboard', async function (this: CustomWorld): Promise<void> {
  // After login the user lands on the dashboard/accounts area.
  await expect(this.page).not.toHaveURL(/\/login$/);
});

Then(
  'a login error message {string} should be displayed',
  async function (this: CustomWorld, expectedMessage: string): Promise<void> {
    await expect(this.pages.zincBankLoginPage.errorMessage).toBeVisible();
    await expect(this.pages.zincBankLoginPage.errorMessage).toContainText(expectedMessage);
  },
);
```

**Commands the agent runs to validate:**

```bash
npx cucumber-js --tags "@smoke"
npm run verify
npm run report:cucumber
```

**Remember:** if the agent reports ambiguous steps or duplicate page objects, it should have
searched `src/pages/` and `src/steps/` first and reused what exists.

---

### 6.3 Healer Agent — Fix a failing test

**Agent:** `healer-agent` · **Mode:** Act · **Tools:** Read, Write, Edit, Bash, Browser

The Healer diagnoses failing scenarios using evidence (error message, screenshot, trace),
applies targeted repairs, and re-runs. It is **strictly limited to 3 healing attempts** — after
that it stops and asks you for help. It never disables assertions, skips/deletes tests, adds
arbitrary waits, or hides failures.

**Example prompt:**

> Use the healer-agent to fix the failing scenario
> **"Sign in with invalid credentials shows an error"** in
> `features/login/zincbank-login.feature`.
>
> It recently failed in CI with an assertion error on the login error message. Run the
> scenario locally, inspect the artifacts in `reports/artifacts/`, find the root cause, apply
> at most 3 fixes, and validate with `npm run verify`.

**Healing workflow the agent follows:**

```text
Failure → Analyze → Attempt #1 → Run test → still failing?
  → Attempt #2 → Run test → still failing?
  → Attempt #3 → Run test → still failing? → ASK USER FOR HELP
```

**Common root causes the Healer checks (ZincBank context):**

| Symptom                                                | Likely root cause / fix                                                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `getByTestId('login-error')` times out                 | ZincBank has no such `data-test`; the error is in `role="alert"` — use `getByRole('alert')` or `getByText('Invalid email or password.')` |
| Error message assertion fails on copy                  | Copy changed ("Invalid email or password.") — update the expected text                                                                   |
| Empty-field scenario fails                             | The form may allow empty submit; add `expect(...).toHaveValue` / validation steps instead of assuming client validation                  |
| Stale screenshot shows element present but step failed | Timing: rely on Playwright auto-waiting; never add `waitForTimeout`                                                                      |
| Test passes locally, fails in CI                       | `.env` credentials missing in CI — add CI secrets / `prepare-env`                                                                        |

**Example prompt for a specific fix request:**

> The scenario below fails: `npx cucumber-js --tags "@sanity"`.
> Error: `Timed out waiting for getByRole('alert')`.
> Please heal it (max 3 attempts): the ZincBank error is rendered in `role="alert"`; there is
> no `data-test` element on the login page.

**What the agent reports after healing:**

- Root cause identified
- Files changed (with diffs)
- Test result before/after (real pass/fail counts)
- Confirmation that `npm run verify` passed

---

### 6.4 Git Agents — branch, commit, push, PR

The Git agents keep `main` clean and safe. They never push without your approval, never
force-push, and never commit secrets or `.env`.

#### Branch Agent — create a feature branch

**Prompt:**

> Use the branch-agent to create a branch for the ZincBank login test work:
> type `test`, description `zincbank-login-scenarios`.

**Result:** `git checkout -b test/zincbank-login-scenarios` (from an up-to-date `main`).

| Type    | Prefix     | ZincBank example                       |
| ------- | ---------- | -------------------------------------- |
| Feature | `feature/` | `feature/zincbank-account-apply-tests` |
| Bug fix | `bugfix/`  | `bugfix/zincbank-login-error-locator`  |
| Test    | `test/`    | `test/zincbank-login-scenarios`        |
| Chore   | `chore/`   | `chore/update-zincbank-base-url`       |

#### Commit Agent — commit the new tests

**Prompt:**

> Use the commit-agent to commit the new ZincBank login feature files, step definitions, and
> page object on branch `test/zincbank-login-scenarios`.

The agent inspects `git status` + `git diff` first, blocks anything unsafe (`.env`, secrets,
reports), then creates a Conventional Commit:

```text
test: add ZincBank login BDD scenarios

- zincbank-login.feature with happy-path and negative login coverage
- ZincBankLoginPage page object (role/label locators)
- thin step definitions delegating to the page object
```

#### Push Agent — push with approval

**Prompt:**

> Use the push-agent to push branch `test/zincbank-login-scenarios` to origin.

The agent **will ask for your explicit approval** before running
`git push -u origin test/zincbank-login-scenarios`. Approve only when ready.

#### PR Agent — draft a pull request

**Prompt:**

> Use the pr-agent to draft a pull request for `test/zincbank-login-scenarios` into `main`.
> I ran the suite: 3 scenarios passed, 0 failed.

The PR body the agent drafts includes:

- **Summary** of what changed and why (ZincBank login coverage)
- **Test results**: exact scenario/step pass/fail counts from the Cucumber report
- **Reports**: paths to `reports/cucumber-report/cucumber-report.html` and Allure report
- **Checklist**: `npm run verify` ✅, `npm run verify:secrets` ✅, CI status

> The PR agent never opens the PR without your explicit approval, and never claims tests pass
> unless it actually ran them.

---

### 6.5 Jira Agents — import & status sync

Jira agents are optional and require environment variables (never stored in code):

```dotenv
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT=QA
# optional
JIRA_ISSUE_TYPE=Bug
```

#### Jira Import Agent — import failed scenarios as issues

The agent reads the latest Cucumber report, converts failed scenarios into Jira test/bug
issues, and **searches for duplicates by summary before creating anything**.

**Example prompt:**

> Use the jira-import-agent to import the failed ZincBank login scenarios from the latest
> report into project `QA`. Run a dry-run first and show me what would be created.

The agent runs:

```bash
npm run report:cucumber     # ensure the report exists
npm run jira:import:dry-run # mandatory preview
```

Then, after **your approval**, it runs `npm run jira:import` and reports:

- Created issue keys (e.g. `QA-142`)
- Skipped issues that already existed (same summary) — never duplicates

> The agent never creates duplicate issues and never exposes credentials in output/logs.

#### Jira Status Update Agent — sync statuses from the latest report

The agent reads `reports/cucumber-report/cucumber-report.json`, maps scenarios to Jira issues,
and transitions their statuses. **It never marks a test PASS when the latest result is FAIL.**

**Example prompt:**

> Use the jira-status-agent to update Jira issue statuses from the latest ZincBank login test
> report. Map the scenario "Successful login with valid credentials" to issue `QA-142` and
> update it to the status that reflects a passing result.

The agent uses:

```bash
npm run jira:status -- QA-142 "Done"
```

and always bases updates on the **latest** report only.

---

## 7. Built-in Workflows

Workflows orchestrate multiple agents end-to-end. Just ask for the workflow by name.

### `create-test` — plan → generate → run → verify

Best for adding coverage for a brand-new feature. Works in **plan mode** first.

**Example prompt:**

> Run the `create-test` workflow for the ZincBank account application flow
> (`https://zincbank.cydeo.io/apply`): a user should be able to open a checking account via
> the 6-step wizard. Reuse any existing ZincBank steps/page objects.

| Step            | What happens                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1. Plan         | Planner Agent inspects the live `/apply` wizard, produces a structured test plan, and saves it to `specs/` **after your approval** |
| 2. Generate     | Test Generator Agent creates `features/apply/zincbank-apply.feature`, steps, and page objects                                      |
| 3. Run & verify | `npx cucumber-js --tags "<tag>"`, `npm run verify`, `npm run report:cucumber`                                                      |
| 4. Report       | Summarizes pass/fail counts; **does not commit/push unless asked**                                                                 |

### `heal-test` — reproduce → analyze → fix (max 3) → validate

**Example prompt:**

> Run the `heal-test` workflow on the ZincBank login scenario tagged `@sanity` — it is failing
> in CI.

| Step         | What happens                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| 1. Reproduce | Runs the failing scenario and captures the error                                                           |
| 2. Analyze   | Reads error + artifacts in `reports/artifacts/`, inspects feature/steps/page object, states the root cause |
| 3. Apply fix | Healer Agent, max 3 attempts, each followed by a re-run                                                    |
| 4. Validate  | `npm run verify` + `npm run report:cucumber`; reports the final status honestly                            |

### `jira-import` and `jira-status-update`

See Section 6.5. Both require `JIRA_*` env vars and always run a **dry-run / fresh report**
first.

---

## 8. Skills Quick Reference

Skills are the knowledge the agents apply automatically (no action needed from you, but it
helps to know the conventions):

| Skill                    | Key conventions                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `playwright`             | Auto-waiting + `expect` assertions; never `waitForTimeout`; fresh `BrowserContext`/`Page` per scenario; `data-test` is the registered test-id |
| `cucumber`               | `features/<area>/<name>.feature`; business-readable Gherkin; tags `@smoke` `@sanity` `@critical` `@regression` `@wip`; thin step definitions  |
| `page-object-model`      | One page/component per file; extend `BasePage`; locators as `readonly` fields; actions as methods; no assertions in page objects              |
| `test-design`            | Happy-path + negative + boundary + validation; one behavior per scenario; independent scenarios                                               |
| `test-healing`           | Evidence-first; root-cause hypothesis before editing; max 3 attempts; never hide failures                                                     |
| `git`                    | Conventional Commits; branch prefixes; never `.env`/secrets; never push without approval                                                      |
| `jira`                   | Dedupe + dry-run before import; status transitions; never PASS on FAIL                                                                        |
| `reporting`              | `npm run report:cucumber` / `report:allure` / `report:clean`; artifacts in `reports/artifacts/`                                               |
| `environment-management` | `ENV=qa npm test`; config via `src/config/config.ts` + `.env`; never hardcode URLs/credentials                                                |

**Locator priority (from `locator-rules`)** — used by every agent:

```text
role → label → placeholder → text → testId (data-test) → stable CSS → XPath (last resort)
```

---

## 9. Rules & Guardrails

These are enforced on every agent run (`.clinerules/`). Knowing them helps you predict and
review agent behavior.

### Always approved without extra approval

- Reading files, searching, running the suite locally, generating reports
- Fixing lint/format/type errors, updating locators, adding step definitions for requested features
- Running the healing workflow within its 3-attempt limit

### Requires your explicit approval

- Committing, pushing, force-pushing, or opening a pull request
- Creating Jira issues or changing Jira statuses (dry-run first)
- Deleting any file/directory, disabling/skipping/deleting an existing test
- Creating or modifying test plan files under `specs/` (the Planner Agent asks for your
  approval before writing any plan there)
- Running destructive commands (`git reset --hard`, `git clean`, `rm -rf`)
- Switching environments with real credentials or pointing tests at `prod`
- Modifying files outside the task scope

### Non-negotiable rules

- Never claim a test passed (or a fix works) unless the agent actually ran it
- Never commit secrets or `.env`; run `npm run verify:secrets` before commits
- Never add arbitrary waits or XPath when a Playwright locator exists
- Never create duplicate Page Objects, step definitions, or Jira issues
- Never mark a Jira test PASS when the latest automation result is FAIL
- Healer Agent stops after 3 failed attempts and asks you for help

---

## 10. Reports & Artifacts

After any agent run, inspect results like this:

```bash
npm run report:cucumber          # HTML/JSON + console summary
npm run report:allure            # generate Allure report
npm run report:allure:open       # open it in a browser
npm run report:clean             # wipe reports/ (before a fresh run)
```

| Artifact / report               | Location                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| Cucumber HTML report            | `reports/cucumber-report/cucumber-report.html`               |
| Cucumber JSON report            | `reports/cucumber-report/cucumber-report.json`               |
| Allure results                  | `reports/allure-results/`                                    |
| Allure report                   | `reports/allure-report/`                                     |
| Failure screenshot              | `reports/artifacts/<scenario>.png`                           |
| Playwright trace (when enabled) | `reports/artifacts/<scenario>.zip`                           |
| Error message / console errors  | `reports/artifacts/error-message.txt` / `console-errors.txt` |

Validate the JSON report before sharing results:

```bash
node -e "JSON.parse(require('fs').readFileSync('reports/cucumber-report/cucumber-report.json','utf8')); console.log('valid')"
```

---

## 11. Troubleshooting

| Symptom                             | Likely fix                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Agents can't find ZincBank elements | ZincBank uses `data-test` (already registered). Confirm the exact `data-test` value on the live page before writing locators |
| Login test fails only in CI         | Missing credentials in CI — add GitHub Secrets / Jenkins credentials and run `prepare-env`                                   |
| `npx playwright install` needed     | `npx playwright install chromium`                                                                                            |
| Allure CLI unknown syntax error     | Use the script: `npm run report:allure` (uses the new `allure generate ... --output` syntax)                                 |
| Parallel flakiness                  | Lower `WORKERS`; ensure scenarios are isolated (fresh context per scenario)                                                  |
| "Step ambiguous" error              | Two step definitions match the same text — consolidate into parameterized steps                                              |
| Healer keeps failing the same way   | After 3 attempts it must stop — re-verify the expected behavior on the live site and give the agent new evidence             |
| Jira import creates duplicates      | It must not — always run `npm run jira:import:dry-run` and confirm the dedupe search before real import                      |
| Secrets flagged by `verify:secrets` | Remove the real value or add a precise ignore in `scripts/verify-secrets.js`                                                 |

---

## Appendix — Quick Prompt Cheat-Sheet

| Task                               | Prompt to use                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan a new ZincBank feature        | _Use the planner-agent to plan BDD coverage for the ZincBank <feature> at <url>. Inspect the live UI first._                                               |
| Generate tests from a plan         | _Use the test-generator-agent to implement the ZincBank <feature> test plan. Reuse existing page objects/steps, run the tests, then run `npm run verify`._ |
| End-to-end new feature             | _Run the `create-test` workflow for <feature>._                                                                                                            |
| Fix a failing test                 | _Run the `heal-test` workflow on scenario <name>._                                                                                                         |
| Create a branch                    | _Use the branch-agent to create branch <type>/<description>._                                                                                              |
| Commit changes                     | _Use the commit-agent to commit <what>. Verify no secrets first._                                                                                          |
| Push / open a PR                   | _Use the push-agent / pr-agent (approve when asked)._                                                                                                      |
| Import failures into Jira          | _Use the jira-import-agent. Dry-run first._                                                                                                                |
| Sync Jira statuses from the report | _Use the jira-status-agent. Never PASS on FAIL._                                                                                                           |
