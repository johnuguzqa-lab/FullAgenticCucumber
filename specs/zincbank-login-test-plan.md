# ZincBank Login — BDD Test Plan

> Produced by the Planner Agent. All behaviors below were **inspected live** on
> `https://zincbank.cydeo.io` — nothing is guessed.
>
> Status: `awaiting-approval` · Handoff target: `test-generator-agent`

## Target

| Item           | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Feature        | ZincBank Login                                                              |
| Login URL      | `https://zincbank.cydeo.io/login`                                           |
| Post-login URL | `https://zincbank.cydeo.io/dashboard`                                       |
| Credentials    | `USERNAME` / `PASSWORD` from `.env` → `config.username` / `config.password` |

## Live-UI Findings (verified)

| #   | Check                            | Verified result                                                                         |
| --- | -------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Login page title                 | **"Log in · ZincBank"**                                                                 |
| 2   | Email field                      | `<label>Email</label>` + placeholder `you@example.com` → `getByLabel('Email')`          |
| 3   | Password field                   | `<label>Password</label>` → `getByLabel('Password')`                                    |
| 4   | Submit button                    | **"Sign in"** → `getByRole('button', { name: 'Sign in' })`                              |
| 5   | `data-test` attributes           | **None exist on the login page** — use role/label locators, not `data-test`             |
| 6   | Invalid email+password           | Stays on `/login` · `role="alert"` shows **"Invalid email or password."**               |
| 7   | Valid creds (from `.env`)        | Redirects to `/dashboard`, title "Dashboard · ZincBank", nav + heading "Welcome, there" |
| 8   | Empty fields submit              | No redirect, no error alert (silently ignored; form is `novalidate`, no `required`)     |
| 9   | Malformed email (`not-an-email`) | No redirect, no error alert (client-side gating blocks submit)                          |
| 10  | Valid email + empty password     | No redirect, no error alert                                                             |

## Test Plan

```
Feature: ZincBank Login

Scenario 1: Successful login with valid credentials
Preconditions: .env has USERNAME and PASSWORD set; no existing session
Steps:
  Given I open the ZincBank login page
  When I sign in with my registered email and password
  Then I am redirected to the ZincBank dashboard
  And the dashboard navigation is displayed
Priority: Critical
Tag: @smoke @critical
Notes: Credentials come from config (never hardcoded). Assert URL /dashboard
       + header nav + heading "Welcome, there".

Scenario 2: Login with an unregistered email shows an error
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "wrong@example.com" and password "wrongpass"
  Then a login error message "Invalid email or password." should be displayed
  And I remain on the login page
Priority: High
Tag: @sanity
Notes: Server-side check; error renders in role="alert".

Scenario 3: Login with a correct email and wrong password shows an error
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "<config.username>" and password "wrongpass"
  Then a login error message "Invalid email or password." should be displayed
  And I remain on the login page
Priority: High
Tag: @sanity

Scenario 4: Login with a malformed email is not submitted
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "not-an-email" and password "whatever123"
  Then no login error message is displayed
  And I remain on the login page
Priority: Medium
Tag: @regression
Notes: Client-side gating blocks submit (no server round-trip).

Scenario 5: Login with empty fields is not submitted
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "" and password ""
  Then no login error message is displayed
  And I remain on the login page
Priority: Medium
Tag: @regression

Scenario 6: Login with a valid email but empty password is not submitted
Preconditions: None
Steps:
  Given I open the ZincBank login page
  When I sign in with email "<config.username>" and password ""
  Then no login error message is displayed
  And I remain on the login page
Priority: Low
Tag: @regression
```

## Reuse Analysis

| Existing artifact                                          | Reusable?                                                        | Action                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/pages/LoginPage.ts`                                   | ❌ Saucedemo-specific                                            | Create `ZincBankLoginPage.ts`                                                      |
| `Given I open the application` (`login.steps.ts`)          | ⚠️ Saucedemo                                                     | New `Given I open the ZincBank login page`                                         |
| `When I login with username ...`                           | ⚠️ Same concept, diff fields                                     | New `When I sign in with email ...`                                                |
| `Then a login error message "<error>" should be displayed` | ⚠️ **Step already registered** (bound to Saucedemo `errorAlert`) | Collision risk — reuse if refactored, else use distinct wording; avoid duplication |
| `Then the inventory page is displayed`                     | ❌ Saucedemo-specific                                            | New `Then I am redirected to the ZincBank dashboard`                               |
| `features/login.feature`                                   | ⚠️ Same area, Saucedemo                                          | Keep separate: `features/login/zincbank-login.feature`                             |

## Handoff

This plan contains no implementation code (Planner Agent rule). Hand off to the
**test-generator-agent** to implement `features/login/zincbank-login.feature`,
`src/pages/ZincBankLoginPage.ts`, and thin step definitions. Instruct it to check
`src/steps/login.steps.ts` for the existing error-message step and avoid Cucumber
step ambiguity.
