@zincbank @login
Feature: ZincBank Login
  As a ZincBank customer
  I want to sign in with my email and password
  So that I can access my accounts and move money

  Background:
    Given I open the ZincBank login page

  @smoke @critical
  Scenario: Successful login with valid credentials
    When I sign in with my registered email and password
    Then I am redirected to the ZincBank dashboard
    And the dashboard navigation is displayed

  @sanity
  Scenario: Login with an unregistered email shows an error
    When I sign in with email "wrong@example.com" and password "WrongPassword123"
    Then a login error message "Invalid email or password." should be displayed
    And I remain on the login page

  @sanity
  Scenario: Login with a correct email and wrong password shows an error
    When I sign in with my registered email and a wrong password
    Then a login error message "Invalid email or password." should be displayed
    And I remain on the login page

  @regression
  Scenario: Login with a malformed email is not submitted
    When I sign in with email "not-an-email" and password "whatever123"
    Then a login validation message "Enter your email and password." should be displayed
    And I remain on the login page

  @regression
  Scenario: Login with empty fields is not submitted
    When I sign in with email "" and password ""
    Then a login validation message "Enter your email and password." should be displayed
    And I remain on the login page

  @regression
  Scenario: Login with a valid email but an empty password is not submitted
    When I sign in with my registered email and no password
    Then a login validation message "Enter your email and password." should be displayed
    And I remain on the login page
