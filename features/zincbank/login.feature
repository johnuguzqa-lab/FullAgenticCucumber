Feature: ZincBank Login
  As a ZincBank customer
  I want to sign in with my credentials
  So that I can access my dashboard

  Background:
    Given I open the ZincBank login page

  @smoke @critical
  Scenario: Successful sign-in with valid credentials
    When I sign in with the configured valid credentials
    Then I am redirected to the ZincBank dashboard

  @regression @critical
  Scenario: Sign-in with invalid credentials
    Given I am on the ZincBank login page
    When I sign in with an invalid email and password
    Then I see the login message "Invalid email or password."
    And I remain on the ZincBank login page

  @regression
  Scenario: Submit with empty fields
    Given I am on the ZincBank login page
    When I submit the form with empty email and password
    Then I remain on the ZincBank login page

  @regression
  Scenario: Submit with a malformed email
    Given I am on the ZincBank login page
    When I enter a malformed email and a password, then submit
    Then I remain on the ZincBank login page

  @smoke
  Scenario: Open an account navigates to /apply
    Given I am on the ZincBank login page
    When I click the "Open an account" link
    Then I am on the ZincBank account-opening page

  @sanity
  Scenario: Login page renders correctly
    Given I open the ZincBank login page
    Then the heading "Sign in to ZincBank", the Email field, the Password field, and the "Sign in" button are visible
    And the "Open an account" link is visible
