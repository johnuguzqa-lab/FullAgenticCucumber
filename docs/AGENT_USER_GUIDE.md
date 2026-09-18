# ZincBank Agent User Guide

A practical guide to using the **AI agent toolchain** that ships with this Playwright + TypeScript + Cucumber BDD framework.

Every example in this guide uses **[ZincBank](https://zincbank.cydeo.io/login)** — a demo online banking application — as the application under test. The same prompts, workflows, and commands apply to any application you point the framework at.

---

## Table of Contents

- [1. What are the agents?](#1-what-are-the-agents)
- [2. How to call an agent](#2-how-to-call-an-agent)
- [3. The reference app: ZincBank](#3-the-reference-app-zincbank)
- [4. Planner Agent — plan tests before writing code](#4-planner-agent--plan-tests-before-writing-code)
- [5. Test Generator Agent — turn a plan into working tests](#5-test-generator-agent--turn-a-plan-into-working-tests)
- [6. Healer Agent — fix failing tests (max 3 attempts)](#6-healer-agent--fix-failing-tests-max-3-attempts)
- [7. Git agents — branch, commit, push, pull request](#7-git-agents--branch-commit-push-pull-request)
- [8. Jira Import Agent — turn scenarios into Jira issues](#8-jira-import-agent--turn-scenarios-into-jira-issues)
- [9. Jira Status Agent — sync Jira with the latest run](#9-jira-status-agent--sync-jira-with-the-latest-run)
- [10. Workflows — the recommended entry points](#10-workflows--the-recommended-entry-points)
- [11. Skills — reusable know-how the agents follow](#11-skills--reusable-know-how-the-agents-follow)
- [12. Rules & guardrails](#12-rules--guardrails)
- [13. Quick reference: commands](#13-quick-reference-commands)
- [14. Tips & best practices](#14-tips--best-practices)

---

## 1. What are the agents?

The framework ships with a set of **specialized Cline agents** (defined in `.cline/agents/`) plus **workflows** (`.cline/workflows/`) that orchestrate them, **skills** (`.cline/skills/`) they rely on, and **rules** (`.clinerules/`) that keep them safe.

| Agent                  | What it does                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planner-agent`        | Converts a requirement into a structured BDD test plan. **Inspects the live UI first** — never guesses. Produces a plan, not code.                   |
| `test-generator-agent` | Turns the plan into a real `feature` file, thin step definitions, and Page Objects. **Reuses** existing framework code and runs the generated test.  |
| `healer-agent`         | Diagnoses and repairs a failing scenario from evidence (screenshot, trace, error). **Strict limit: 3 healing attempts**, then it stops and asks you. |
| `branch-agent`         | Creates a correctly named branch (`feature/`, `bugfix/`, `test/`, `chore/`). Never works on `main` without approval.                                 |
| `commit-agent`         | Reviews the diff, blocks secrets/`.env`, and writes a Conventional Commit.                                                                           |
| `push-agent`           | Pushes the current branch — **only after your explicit approval**.                                                                                   |
| `pr-agent`             | Drafts a pull request with real test results and report links — opens it **only after your approval**.                                               |
| `jira-import-agent`    | Imports BDD scenarios into Jira as test issues. **Searches for duplicates first** and never creates them blindly.                                    |
| `jira-status-agent`    | Syncs Jira issue statuses from the **latest** automation report. Never marks PASS when the latest result is FAIL.                                    |

The intended flow through the agents looks like this:

```text
Requirement
     ↓
Planner Agent        →  BDD test plan (no code)
     ↓
Test Generator Agent →  feature file + steps + Page Objects, test runs green
     ↓
Run the suite → reports + artifacts
     │                     │
     ↓                     ↓
Report / Jira        failing? → Healer Agent (max 3 attempts)
                              → still failing? → ask the user
```

## 2. How to call an agent

Agents and workflows are invoked **by name** in Cline — either directly in a prompt or via the workflow that orchestrates them.

### Using a workflow (recommended)

Workflows are the safe, complete recipes. Use them for the common jobs:

| Workflow             | Use when you want to…                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| `create-test`        | Add BDD coverage for a new ZincBank feature (plan → generate → run → verify).  |
| `heal-test`          | Repair a failing ZincBank scenario (reproduce → analyze → fix ≤ 3 → validate). |
| `jira-import`        | Turn ZincBank scenarios into Jira issues (dry-run first, dedupe, then import). |
| `jira-status-update` | Update Jira issue statuses from the latest run.                                |

Example prompts that trigger them:

```text
/create-test Add BDD coverage for signing in to ZincBank at https://zincbank.cydeo.io/login

/heal-test The "Successful sign in with valid credentials" scenario keeps failing

/jira-import Import the ZincBank sign-in scenarios into Jira

/jira-status-update Sync Jira with the latest ZincBank run
```

### Calling a single agent

If you only need one role, address it directly:

```text
Use the Planner Agent to plan tests for the ZincBank account-opening flow.

Use the Test Generator Agent to implement the ZincBank sign-in plan.

Use the Healer Agent to fix the failing ZincBank transfer test.

Use the Commit Agent to commit the ZincBank sign-in tests.
```

### What happens under the hood

When you call an agent or workflow, Cline:

1. Loads the agent's instructions from `.cline/agents/<name>/` (and the workflow from `.cline/workflows/`).
2. Reads the relevant **skills** (`.cline/skills/`) — e.g. `playwright`, `cucumber`, `page-object-model` — so it follows framework conventions.
3. Applies the **rules** in `.clinerules/` — e.g. no hardcoded credentials, no arbitrary waits, approval gates before git/Jira writes.
4. Uses the built-in tools (Read, Edit, Bash, Browser/Playwright) to do the work.

---

## 3. The reference app: ZincBank

All examples target **[ZincBank](https://zincbank.cydeo.io/login)** — a demo online banking application.

| Item                | Value                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Sign-in page        | `https://zincbank.cydeo.io/login`                                                                                  |
| Account application | `https://zincbank.cydeo.io/apply`                                                                                  |
| Sign-in credentials | Registered customer credentials, provided via `.env` (`USERNAME` / `PASSWORD`) or CI secrets — **never hardcoded** |

### What the Sign In page looks like (verified against the live site)

| Element           | Accessible name / text                       | Recommended locator                                     |
| ----------------- | -------------------------------------------- | ------------------------------------------------------- |
| Heading           | `Sign in to ZincBank`                        | `getByRole('heading', { name: 'Sign in to ZincBank' })` |
| Email field       | label `Email`, placeholder `you@example.com` | `getByLabel('Email')`                                   |
| Password field    | label `Password`                             | `getByLabel('Password')`                                |
| Submit button     | `Sign in`                                    | `getByRole('button', { name: 'Sign in' })`              |
| Error region      | alert role                                   | `getByRole('alert')`                                    |
| Registration link | `Open an account` → `/apply`                 | `getByRole('link', { name: 'Open an account' })`        |

### What the account application looks like (verified against the live site)

`/apply` is a **6-step flow**. Step 1 "Choose your accounts" includes:

- **Checking account** — always included, checkbox pre-selected (label: `Checking account (always included)`)
- **Savings account** — optional (label: `Open a savings account`)
- **Joint account** — disabled / "Coming soon" (label: `Joint account (coming soon)`)
- **Continue** button to move to step 2

### Where tests live in this framework

| Artifact           | Location                         | ZincBank example                                       |
| ------------------ | -------------------------------- | ------------------------------------------------------ |
| Gherkin features   | `features/<area>/<name>.feature` | `features/zincbank/login.feature`                      |
| Step definitions   | `src/steps/<name>.steps.ts`      | `src/steps/zincbank-login.steps.ts`                    |
| Page Objects       | `src/pages/<Name>Page.ts`        | `src/pages/ZincSignInPage.ts`                          |
| Page composition   | `src/fixtures/pages.ts`          | register the new page object                           |
| Test data          | `src/data/generators/`           | `src/data/generators/zincbank-user.ts`                 |
| Credentials & URLs | `.env` + `src/config/config.ts`  | `config.baseUrl`, `config.username`, `config.password` |

---

## 4. Planner Agent — plan tests before writing code

**Purpose:** Turn a requirement into a structured BDD test plan. The Planner **inspects the live application first** and **never writes code** — it hands off to the Test Generator Agent.

**Key rules**

- Inspect the real UI (browser / Playwright MCP) to confirm labels, buttons, and flows — never guess.
- Produce a plan, not implementation code.
- Reuse existing steps and Page Objects where possible.
- Assign tags (`@smoke`, `@sanity`, `@critical`, `@regression`, `@wip`) and priorities.

### Example prompt

```text
Use the Planner Agent.
Requirement: As a ZincBank customer I want to sign in with my email and password
so that I can manage my accounts. Base URL: https://zincbank.cydeo.io/login.
```

### What the Planner does

1. Opens `https://zincbank.cydeo.io/login` in the browser and confirms the real UI:
   - Email field labelled `Email` (placeholder `you@example.com`)
   - Password field labelled `Password`
   - Button `Sign in`
   - Error region with the `alert` role
   - A link `Open an account` pointing at `/apply`
2. Identifies scenario categories: happy path, negative/validation, boundary, empty-state.
3. Checks `src/pages/` and `src/steps/` for reusable components (none exist for ZincBank yet, so it plans new ones).
4. Produces a structured plan.

### Example plan output

```text
Test Plan
---------
Feature: ZincBank Sign In

Scenario 1: Successful sign in with valid credentials
Preconditions: A registered customer exists (credentials in .env)
Steps:
  Given I open the ZincBank application
  And I am on the Sign In page
  When I sign in with my registered credentials
  Then I land on the account overview
Priority: Critical
Tag: @smoke

Scenario 2: Sign in with an invalid password shows a validation error
Preconditions: None
Steps:
  Given I open the ZincBank application
  And I am on the Sign In page
  When I sign in with email "customer@example.com" and password "wrong-password"
  Then a sign in error is displayed
Priority: High
Tag: @sanity

Scenario 3: The Sign In page offers a path to open an account
Steps:
  Given I open the ZincBank application
  And I am on the Sign In page
  When I follow the "Open an account" link
  Then I land on the account application at /apply
Priority: Medium
Tag: @regression

Notes:
- Capture the real error message text from the live app during generation
  (the Planner must not invent UI copy).
- Reuse a parameterized step for the two sign-in variants.
```

---

## 5. Test Generator Agent — turn a plan into working tests

**Purpose:** Implement the Planner's plan as a real Gherkin feature, thin step definitions, and Page Objects. It **reuses** existing framework code and **runs the generated test** before finishing.

**Key rules**

- Reuse existing Page Objects and step definitions — search first, create only when needed.
- Gherkin describes **business behavior**, not DOM details.
- Step definitions stay thin and delegate to Page Objects.
- Follow the locator priority: role → label → placeholder → text → `data-test` → stable CSS → XPath (last resort).
- No arbitrary `waitForTimeout`, no hardcoded credentials or URLs.
- Run the generated test and `npm run verify` before finishing.

### Example prompt

```text
Use the Test Generator Agent with this plan:
Feature: ZincBank Sign In — scenarios 1-3 from the planner plan
(see docs/AGENT_USER_GUIDE.md section 4). Credentials come from .env.
```

### What it produces (following the planner's plan)

**1. Feature file — `features/zincbank/login.feature`**

```gherkin
@smoke
Feature: ZincBank Sign In
  As a ZincBank customer
  I want to sign in with my email and password
  So that I can manage my accounts

  Background:
    Given I open the ZincBank application
    And I am on the Sign In page

  @critical
  Scenario: Successful sign in with valid credentials
    When I sign in with my registered credentials
    Then I land on the account overview

  @sanity
  Scenario Outline: Sign in with invalid credentials shows a validation error
    When I sign in with email "<email>" and password "<password>"
    Then a sign in error is displayed

    Examples:
      | email                      | password       |
      | invalid@example.com        | wrong-password |
```

**2. Thin step definitions — `src/steps/zincbank-login.steps.ts`**

```ts
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { config } from '../config/config';

Given('I open the ZincBank application', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincSignInPage.open();
});

Given('I am on the Sign In page', async function (this: CustomWorld): Promise<void> {
  await expect(this.pages.zincSignInPage.signInButton).toBeVisible();
});

When('I sign in with my registered credentials', async function (this: CustomWorld): Promise<void> {
  await this.pages.zincSignInPage.signIn(config.username, config.password);
});

When(
  'I sign in with email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string): Promise<void> {
    await this.pages.zincSignInPage.signIn(email, password);
  },
);

Then('I land on the account overview', async function (this: CustomWorld): Promise<void> {
  await expect(this.page).toHaveURL(/\/accounts$/);
});

Then('a sign in error is displayed', async function (this: CustomWorld): Promise<void> {
  await expect(this.pages.zincSignInPage.errorAlert).toBeVisible();
});
```

**3. Page Object — `src/pages/ZincSignInPage.ts`**

```ts
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The ZincBank sign-in page.
 *
 * Locators verified against https://zincbank.cydeo.io/login: the email and
 * password fields are exposed via labels "Email"/"Password"; the submit
 * control is a button named "Sign in"; validation failures render in an
 * element with the `alert` role.
 */
export class ZincSignInPage extends BasePage {
  public readonly emailInput: Locator = this.page.getByLabel('Email');
  public readonly passwordInput: Locator = this.page.getByLabel('Password');
  public readonly signInButton: Locator = this.page.getByRole('button', { name: 'Sign in' });
  public readonly errorAlert: Locator = this.page.getByRole('alert');

  private static readonly BASE_PATH = '/login';

  public async open(): Promise<void> {
    await this.goto(ZincSignInPage.BASE_PATH);
    await this.waitForReady();
  }

  public async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

**4. Registration in `src/fixtures/pages.ts`** — add `zincSignInPage: new ZincSignInPage(page)` to `createPageObjects()` and to the `PageObjects` interface.

### How the generator verifies its work

```bash
npx cucumber-js --tags "@smoke"     # run the new coverage (or just the feature)
npm run verify                      # lint + format + typecheck
npm run report:cucumber             # generate the report + summary
```

It reports the exact pass/fail counts honestly — never claims a green run it did not execute.

---

## 6. Healer Agent — fix failing tests (max 3 attempts)

**Purpose:** Repair a failing scenario using **evidence** — the error message, screenshot, trace, and console errors captured on failure. Hard limit of **3 healing attempts**; after that it stops and asks you for help.

**Key rules**

- NEVER disable assertions, delete/skip tests, add arbitrary waits, or hide failures.
- Prefer the locator priority when a locator drifted.
- Validate every fix by re-running the affected test, then `npm run verify`.

### Example prompt

```text
Use the Healer Agent. The ZincBank scenario "Successful sign in with valid
credentials" is failing on CI. Evidence is in reports/artifacts/.
```

### Example diagnosis sequence (what the Healer does)

1. **Reproduce** locally:
   ```bash
   npx cucumber-js --tags "@smoke" 2>&1 | tail -40
   ```
2. **Read the evidence** in `reports/artifacts/`:
   - `Successful sign in with valid credentials.png` — screenshot shows the Sign In page
   - `error-message.txt` — `locator.getByRole('button', { name: 'Log in' }).click(): timeout ...`
3. **Inspect** `features/zincbank/login.feature`, `src/steps/zincbank-login.steps.ts`, `src/pages/ZincSignInPage.ts`.
4. **Root cause:** the button locator says `Log in`, but the live ZincBank DOM exposes a button named `Sign in` (the app was re-skinned).
5. **Fix (attempt 1):** update the Page Object to `getByRole('button', { name: 'Sign in' })`, re-run, confirm it passes. Stop — the limit is only hit on repeated failures.

### The healing loop

```text
Failure → Analyze → Attempt #1 → run → still failing?
  → Attempt #2 → run → still failing?
  → Attempt #3 → run → still failing? → STOP and ask the user
```

### Final validation after a successful heal

```bash
npm run verify
npm run report:cucumber
```

---

## 7. Git agents — branch, commit, push, pull request

The Git agent is split into four focused sub-agents. Together they handle the whole lifecycle — but **never without your approval** at the push/PR gates.

### 7.1 Branch Agent

Creates a correctly named branch. Convention: `<type>/<kebab-case-description>`.

| Type    | Prefix     | ZincBank example                        |
| ------- | ---------- | --------------------------------------- |
| Feature | `feature/` | `feature/zincbank-sign-in`              |
| Bug fix | `bugfix/`  | `bugfix/zincbank-signin-button-locator` |
| Test    | `test/`    | `test/add-zincbank-signin-scenarios`    |
| Chore   | `chore/`   | `chore/update-playwright`               |

**Example prompt**

```text
Use the Branch Agent to create a branch for adding ZincBank sign-in tests.
```

The agent confirms the current branch, fetches latest `main`, creates
`test/add-zincbank-signin-scenarios`, and switches to it.

### 7.2 Commit Agent

Inspects the diff, blocks secrets, writes a Conventional Commit.

**Example prompt**

```text
Use the Commit Agent to commit the ZincBank sign-in tests.
```

The agent:

1. Runs `git status` and `git diff` and reviews every changed file.
2. Blocks anything unsafe: real credentials, `.env`, `node_modules/`, `reports/`, `screenshots/`, `videos/`, `traces/`, debug leftovers.
3. Stages only the intended files:
   ```bash
   git add features/zincbank/login.feature src/steps/zincbank-login.steps.ts \
           src/pages/ZincSignInPage.ts src/fixtures/pages.ts
   ```
4. Commits with a Conventional message:
   ```text
   test: add ZincBank sign-in scenarios

   - Feature: successful sign-in, invalid-credential validation, account-application link
   - New ZincSignInPage page object with label/role locators
   - Registered the page object in src/fixtures/pages.ts
   ```

Before committing it also runs the quality gates:

```bash
npm run verify
npm run verify:secrets
```

### 7.3 Push Agent

Pushes the committed branch — **requires your explicit approval first**.

**Example prompt**

```text
Use the Push Agent to push test/add-zincbank-signin-scenarios.
```

The agent verifies there are commits ahead of `origin`, confirms the remote, then runs `git push -u origin test/add-zincbank-signin-scenarios`. It never force-pushes unless you explicitly ask.

### 7.4 Pull Request Agent

Drafts a PR describing the change, real test results, and report links — then **waits for your approval** to open it.

**Example prompt**

```text
Use the Pull Request Agent to open a PR for the ZincBank sign-in tests.
```

Example PR body the agent would draft:

```markdown
## Summary

Adds BDD coverage for the ZincBank sign-in flow (https://zincbank.cydeo.io/login):
successful sign-in, invalid-credential validation, and the "Open an account" link.

## Test results

- 3 scenarios passed, 0 failed, 0 skipped (npx cucumber-js --tags "@smoke")
- npm run verify: passed (lint + format + typecheck)

## Reports

- Cucumber: reports/cucumber-report/cucumber-report.html
- Allure: reports/allure-report/index.html

## Checklist

- [x] npm run verify
- [x] npm run verify:secrets
- [x] CI green
```

---

## 8. Jira Import Agent — turn scenarios into Jira issues

**Purpose:** Convert BDD scenarios into Jira test issues while **preserving** feature, scenario name, preconditions, steps, expected results, tags, and priority. It **searches for duplicates first** and never creates issues without approval.

**Key rules**

- NEVER create duplicate Jira issues blindly — search first.
- If an equivalent test already exists, report the existing key and create nothing.
- Always `dry-run` before any real creation.

### Prerequisites

Environment configured in `.env` / CI secrets:

```bash
JIRA_BASE_URL=...
JIRA_EMAIL=...
JIRA_API_TOKEN=...
JIRA_PROJECT=...
# optional: JIRA_ISSUE_TYPE (default Bug)
```

### Example prompt

```text
Use the Jira Import Agent to import the scenarios from
features/zincbank/login.feature into Jira (project ZINC).
```

### Step 1 — always preview first

```bash
npm run jira:import:dry-run
```

### Example dry-run output

```text
Dry run — nothing was created.
Would import 3 scenarios from features/zincbank/login.feature:
  - "Successful sign in with valid credentials"        -> new (no existing match)
  - "Sign in with invalid credentials shows a validation error" -> new (no existing match)
  - "The Sign In page offers a path to open an account" -> SKIPPED
    (equivalent issue already exists: ZINC-88)
```

### Step 2 — real import (after you approve)

```bash
npm run jira:import
```

### Example import summary

```text
Created:
  ZINC-101  Successful sign in with valid credentials
  ZINC-102  Sign in with invalid credentials shows a validation error
Skipped (duplicate):
  ZINC-88   The Sign In page offers a path to open an account (already exists)
```

The agent never fabricates Jira keys and never exposes credentials in logs.

---

## 9. Jira Status Agent — sync Jira with the latest run

**Purpose:** Reflect the **latest** automation results back into Jira — passed, failed, and skipped scenarios mapped to their issues.

**Key rules**

- NEVER mark a test PASS when the latest automation result is FAIL.
- Base every update on the **latest** report — never on stale results.
- Never expose credentials in output or logs.

### Prerequisites

Environment configured: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.

### Step 1 — ensure a fresh report

```bash
npx cucumber-js
npm run report:cucumber
```

Only the newest `reports/cucumber-report/cucumber-report.json` may be used as the source of truth.

### Step 2 — map and update

**Example prompt**

```text
Use the Jira Status Agent to update issue statuses from the latest
ZincBank run.
```

The agent:

1. Reads `reports/cucumber-report/cucumber-report.json`.
2. Identifies passed / failed / skipped scenarios.
3. Maps scenarios to Jira issues (by summary/title).
4. Transitions statuses via the helper script:
   ```bash
   npm run jira:status -- ZINC-101 "Passed"
   npm run jira:status -- ZINC-102 "Failed"
   ```
5. Adds execution info and failure details (e.g. error message, artifact path).

### Example summary

```text
ZINC-101  Successful sign in with valid credentials        -> Passed
ZINC-102  Sign in with invalid credentials shows a validation error -> Failed
          (latest run: FAIL - assertion mismatch on error message)
ZINC-88   The Sign In page offers a path to open an account -> unchanged (not executed)
```

If ZINC-102's latest result is FAIL, the agent **must not** mark it PASS — even if an earlier run was green.

---

## 10. Workflows — the recommended entry points

Workflows chain the right agents together so you don't have to remember the order.

### 10.1 `create-test` — add BDD coverage end to end

Use when you want to add coverage for a new ZincBank requirement.

```text
/create-test Add coverage for opening a ZincBank account at https://zincbank.cydeo.io/apply
```

The workflow runs:

| Step            | Who                  | What happens                                                                                                                 |
| --------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. Plan         | Planner Agent        | Opens `/apply` in the browser, confirms the 6-step flow and step-1 checkboxes, produces a test plan.                         |
| 2. Generate     | Test Generator Agent | Creates `features/zincbank/apply.feature`, step definitions, `ZincApplyPage.ts`; reuses the sign-in steps for preconditions. |
| 3. Run & verify | —                    | `npx cucumber-js --tags "@wip"`, then `npm run verify` and `npm run report:cucumber`.                                        |
| 4. Report       | —                    | Summarizes pass/fail counts. Does not commit/push unless you ask.                                                            |

### 10.2 `heal-test` — repair a failing scenario

Use when a ZincBank scenario fails.

```text
/heal-test The "Successful sign in with valid credentials" scenario is failing
```

The workflow runs: reproduce → analyze evidence → apply **at most 3** targeted fixes → validate with `npm run verify`. If still failing after 3 attempts it **stops and asks you for help**.

### 10.3 `jira-import` — file scenarios as Jira issues

```text
/jira-import Import the ZincBank account-application scenarios into Jira
```

Dry-run first (mandatory), de-duplicate, then create issues only after you approve.

### 10.4 `jira-status-update` — sync statuses from the latest run

```text
/jira-status-update Update Jira from the latest ZincBank run
```

Fresh report first, map scenarios → issues, transition statuses. Never PASS on a FAIL result.

---

## 11. Skills — reusable know-how the agents follow

Skills are packaged expertise the agents load when working. You can also reference them directly in a prompt to steer behaviour.

| Skill                    | What it contains                                                                        | When it matters                               |
| ------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| `playwright`             | Recommended locators, auto-waiting, tracing, no arbitrary sleeps                        | Every page object / locator decision          |
| `cucumber`               | Gherkin conventions, feature-file locations, tags, step-definition style, `CustomWorld` | Writing or editing features/steps             |
| `page-object-model`      | One class per page/component, locator encapsulation, composition                        | New ZincBank pages (Sign In, Apply, Accounts) |
| `test-design`            | Positive/negative/boundary coverage, isolation, tagging                                 | Planner output & scenario review              |
| `test-healing`           | Evidence-first diagnosis, 3-attempt limit                                               | Healer Agent runs                             |
| `git`                    | Branch naming, Conventional Commits, secret blocking, approval gates                    | Every git operation                           |
| `jira`                   | Import/status scripts, de-duplication, dry-run first                                    | Jira agents                                   |
| `reporting`              | Report generation commands, artifact locations, JSON validation                         | After any suite run                           |
| `environment-management` | `ENV=qa` selection, `.env` credentials, browser/runtime vars                            | Running against ZincBank on any environment   |

Example of steering with a skill:

```text
Plan ZincBank sign-in tests. Follow the test-design skill: cover happy path,
negative, and boundary cases, and keep scenarios isolated.
```

---

## 12. Rules & guardrails

All agents operate under the rules in `.clinerules/`. The most important ones to know:

| Rule                    | What it means for you                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Approval required**   | Creating/deleting files outside task scope, git push/PR, Jira issue creation, disabling tests — the agent always asks first. |
| **No secrets in code**  | Credentials live only in `.env` / CI secrets. `npm run verify:secrets` scans before commits.                                 |
| **No arbitrary waits**  | Agents rely on Playwright auto-waiting and assertions, never `waitForTimeout`.                                               |
| **Locator priority**    | role → label → placeholder → text → `data-test` → stable CSS → XPath last resort.                                            |
| **Healer limit**        | Max 3 healing attempts, then the agent stops and asks you.                                                                   |
| **Jira de-duplication** | Import agents search before creating; duplicates are reported, not re-created.                                               |
| **Never PASS on FAIL**  | Jira status reflects the latest run; a failed scenario is never marked PASS.                                                 |
| **Thin steps**          | Step definitions delegate to Page Objects; assertions belong in steps.                                                       |
| **Quality gate**        | `npm run verify` (lint + format + typecheck) before finishing any coding task.                                               |

---

## 13. Quick reference: commands

```bash
# Run tests
npm test                                  # full suite (ENV=qa by default)
ENV=qa npm test                           # explicit environment
npm run test:smoke                        # only @smoke scenarios
npm run test:headed                       # HEADLESS=false
npm run test:dry-run                      # validate step definitions, no execution
WORKERS=4 npx cucumber-js                 # parallel

# Validate before committing
npm run verify                            # lint + format + typecheck
npm run verify:secrets                    # scan tracked files for secrets

# Reports & artifacts
npm run report:cucumber                   # Cucumber HTML/JSON + console summary
npm run report:allure                     # generate Allure report
npm run report:allure:open                # open Allure report
npm run report:clean                      # wipe reports/

# Jira
npm run jira:import:dry-run               # preview imports (mandatory before creating)
npm run jira:import                       # create/update Jira issues (deduped)
npm run jira:status -- ZINC-101 "Passed"  # transition an issue
```

---

## 14. Tips & best practices

1. **Let the Planner look at the real app.** ZincBank's copy changes (e.g. the button says `Sign in`, not `Log in`). Always let the Planner/Healer verify the live DOM — don't guess from memory.
2. **Run dry runs first.** `npm run test:dry-run` catches missing/ambiguous steps, `npm run jira:import:dry-run` previews Jira changes. Cheap and safe.
3. **Give the agents full context.** Include the URL, the scenario name, and any evidence path in your prompt — e.g. _"evidence in reports/artifacts/"_.
4. **Credentials stay in `.env`.** If the agent ever proposes hardcoding a ZincBank password, stop it — that violates the security rules.
5. **Keep scenarios isolated.** Each ZincBank scenario runs in a fresh `BrowserContext`; never write tests that depend on order or shared state.
6. **Honest results only.** If a test did not run green, don't let anyone mark it PASS — neither you nor the agents.
7. **One workflow per job.** For new coverage use `create-test`; for failures `heal-test`; for Jira `jira-import` / `jira-status-update`. Avoid mixing concerns.
8. **Read the failure artifacts.** Screenshots + trace in `reports/artifacts/` usually reveal the root cause faster than the stack trace alone.
