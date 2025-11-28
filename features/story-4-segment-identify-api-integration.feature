Feature: Segment Identify API Integration
  As a developer
  I want to send transformed customer data to Segment Identify API
  So that users are created or updated in Segment identified by email

  Background:
    Given the Segment client is initialized with write key from environment
    And transformed customer data is available

  Scenario: Send customer data to Segment Identify API successfully
    Given transformed customer data with email "user@example.com"
    When I send the customer data to Segment Identify API
    Then the API call should succeed
    And the customer should be identified in Segment with userId "user@example.com"

  Scenario: Send customer data with email as userId
    Given transformed customer data with email "test@example.com"
    When I send the customer data to Segment Identify API
    Then the API call should use email "test@example.com" as userId

  Scenario: Send customer data with email trait
    Given transformed customer data with email "user@example.com"
    When I send the customer data to Segment Identify API
    Then the API call should include email "user@example.com" in traits

  Scenario: Send customer data with name trait
    Given transformed customer data with:
      | field | value           |
      | email | user@example.com|
      | name  | John Doe        |
    When I send the customer data to Segment Identify API
    Then the API call should include name "John Doe" in traits

  Scenario: Send customer data with address trait
    Given transformed customer data with:
      | field      | value           |
      | email      | user@example.com|
      | street     | 123 Main St     |
      | city       | New York        |
      | postalCode | 10001           |
      | country    | US              |
    When I send the customer data to Segment Identify API
    Then the API call should include address in traits:
      | street     | city      | postalCode | country |
      | 123 Main St| New York  | 10001      | US      |

  Scenario: Send customer data with all traits (email, name, address)
    Given transformed customer data with:
      | field      | value           |
      | email      | user@example.com|
      | name       | Jane Smith      |
      | street     | 456 Oak Ave     |
      | city       | Los Angeles     |
      | postalCode | 90001           |
      | country    | US              |
    When I send the customer data to Segment Identify API
    Then the API call should succeed
    And the API call should use email "user@example.com" as userId
    And the API call should include email "user@example.com" in traits
    And the API call should include name "Jane Smith" in traits
    And the API call should include address in traits:
      | street     | city        | postalCode | country |
      | 456 Oak Ave| Los Angeles | 90001      | US      |

  Scenario: Handle successful API response
    Given transformed customer data with email "user@example.com"
    When I send the customer data to Segment Identify API
    Then the function should return success status
    And no error should be thrown

  Scenario: Handle API error gracefully
    Given transformed customer data with email "user@example.com"
    And the Segment API will return an error
    When I send the customer data to Segment Identify API
    Then the function should return error status
    And the error should be handled gracefully

  Scenario: Send customer.created event data to Segment
    Given transformed customer data from customer.created event with email "newuser@example.com"
    When I send the customer data to Segment Identify API
    Then the API call should succeed
    And the customer should be identified in Segment with userId "newuser@example.com"

  Scenario: Send customer.updated event data to Segment
    Given transformed customer data from customer.updated event with email "existing@example.com"
    When I send the customer data to Segment Identify API
    Then the API call should succeed
    And the customer should be identified in Segment with userId "existing@example.com"

  Scenario Outline: Send customer data with different email addresses
    Given transformed customer data with email "<email>"
    When I send the customer data to Segment Identify API
    Then the API call should use email "<email>" as userId
    And the API call should include email "<email>" in traits

    Examples:
      | email                |
      | user@example.com     |
      | test.user@domain.com |
      | admin@company.org    |


