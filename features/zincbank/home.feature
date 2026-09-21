@zincbank @home
Feature: ZincBank Homepage Tabs
  As a visitor to the ZincBank homepage
  I want to see the primary navigation tabs
  So that I can explore the personal, business, cards, and company sections

  @smoke @critical
  Scenario: Homepage displays all four navigation tabs
    Given I open the ZincBank homepage
    Then I see the navigation tabs "Personal", "Business", "Cards", "Company"

  @sanity
  Scenario Outline: Tabs link to their sections
    Given I open the ZincBank homepage
    When I click the "<tab>" tab
    Then the URL fragment becomes "#<section>"

    Examples:
      | tab      | section      |
      | Personal | features     |
      | Business | features     |
      | Cards    | feature-card |
      | Company  | footer       |
