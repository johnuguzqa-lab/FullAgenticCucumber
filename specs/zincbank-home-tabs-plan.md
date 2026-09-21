# ZincBank Homepage Tabs — BDD Test Plan

> Produced by the Planner Agent. All behaviors below were **inspected live** on
> `https://zincbank.cydeo.io/` — nothing is guessed.
>
> Status: `approved` · Handoff target: `test-generator-agent`

## Target

| Item        | Value                                                           |
| ----------- | --------------------------------------------------------------- |
| Feature     | ZincBank Homepage Tabs                                          |
| Page URL    | `https://zincbank.cydeo.io/`                                    |
| Auth needed | **None** (public marketing/homepage)                            |
| Requirement | Homepage must show tabs: **PERSONAL, BUSINESS, CARDS, COMPANY** |

## Live-UI Findings (verified)

| #   | Check                  | Verified result                                                                                     |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Homepage title         | **"ZincBank — Banking, quietly exceptional"**                                                       |
| 2   | Tabs container         | `banner` → **`navigation "Primary"`** (header)                                                      |
| 3   | **Personal** tab       | `link` "Personal" → URL `/#features`                                                                |
| 4   | **Business** tab       | `link` "Business" → URL `/#features`                                                                |
| 5   | **Cards** tab          | `link` "Cards" → URL `/#feature-card`                                                               |
| 6   | **Company** tab        | `link` "Company" → URL `/#footer`                                                                   |
| 7   | Click behavior         | Each tab scrolls to its section and updates the URL fragment (Personal/Cards/Company verified live) |
| 8   | `data-test` attributes | **None on the homepage** — use role locators, not `data-test`                                       |
| 9   | Other pages            | Tabs exist **only on the homepage** (verified absent on `/login`)                                   |
| 10  | Visible tab text       | Title-case (`Personal`, `Business`, `Cards`, `Company`) — assertion matches **visible text**        |

## Recommended Locators (priority-ordered)

```ts
const primaryNav = page.getByRole('navigation', { name: 'Primary' }); // smallest stable container
primaryNav.getByRole('link', { name: 'Personal' }); // → #features
primaryNav.getByRole('link', { name: 'Business' }); // → #features
primaryNav.getByRole('link', { name: 'Cards' }); // → #feature-card
primaryNav.getByRole('link', { name: 'Company' }); // → #footer
```

## Test Plan

```
Feature: ZincBank Homepage Tabs

Scenario 1: Homepage displays all four navigation tabs          @smoke @critical
  Given I open the ZincBank homepage
  Then I see the navigation tabs "Personal", "Business", "Cards", "Company"

Scenario Outline: Tabs link to their sections                    @sanity
  Given I open the ZincBank homepage
  When I click the "<tab>" tab
  Then the URL fragment becomes "#<section>"

  Examples:
    | tab      | section      |
    | Personal | features     |
    | Business | features     |
    | Cards    | feature-card |
    | Company  | footer       |
```

## Reuse Analysis

| Existing artifact                   | Reusable?        | Action                                                            |
| ----------------------------------- | ---------------- | ----------------------------------------------------------------- |
| `src/pages/ZincBankLoginPage.ts`    | ⚠️ login scope   | **New** `src/pages/ZincBankHomePage.ts` (extends `BasePage`)      |
| `src/fixtures/pages.ts`             | ✅               | Register `zincBankHomePage`                                       |
| `src/steps/zincbank-login.steps.ts` | ⚠️ login wording | **New** thin `src/steps/zincbank-home.steps.ts`                   |
| `features/zincbank/login.feature`   | —                | **New** `features/zincbank/home.feature` tagged `@zincbank @home` |

## Handoff to Test Generator

- **New page object** `src/pages/ZincBankHomePage.ts` extending `BasePage`:
  - `open()` → `goto('/')`; `waitForReady()` waits for the primary navigation
  - Expose the four tab locators scoped to `getByRole('navigation', { name: 'Primary' })`
  - `clickTab(name)` for the outline scenario
- **New thin steps** in `src/steps/zincbank-home.steps.ts`: open homepage, assert the four tabs visible, click a named tab, assert URL fragment. Keep wording distinct from login steps to avoid Cucumber ambiguity.
- **Feature file** `features/zincbank/home.feature` tagged `@zincbank @home`, scenarios as above.
- Validate with `npx cucumber-js --dry-run`, then run the feature until green.
- No `data-test` dependency; no auth; no config/env values needed.
