Feature: Customer Data Transformation
  As a developer
  I want to transform Commercetools customer data into Segment Identify API format
  So that I can send properly formatted data to Segment

  Background:
    Given a transformation function is available

  Scenario: Transform customer with email to Segment format
    Given a Commercetools customer payload with email "user@example.com"
    When I transform the customer data to Segment format
    Then the transformed data should have userId "user@example.com"
    And the transformed data should have email "user@example.com" in traits

  Scenario: Transform customer with first name and last name
    Given a Commercetools customer payload with first name "John" and last name "Doe"
    When I transform the customer data to Segment format
    Then the transformed data should have name "John Doe" in traits

  Scenario: Transform customer with full name
    Given a Commercetools customer payload with full name "Jane Smith"
    When I transform the customer data to Segment format
    Then the transformed data should have name "Jane Smith" in traits

  Scenario: Transform customer with complete address
    Given a Commercetools customer payload with address:
      | street      | city      | postalCode | country |
      | 123 Main St | New York  | 10001      | US      |
    When I transform the customer data to Segment format
    Then the transformed data should have address in traits:
      | street      | city      | postalCode | country |
      | 123 Main St | New York  | 10001      | US      |

  Scenario: Transform customer with all fields (email, name, address)
    Given a Commercetools customer payload with:
      | field      | value           |
      | email      | user@example.com|
      | firstName  | John            |
      | lastName   | Doe             |
      | street     | 123 Main St     |
      | city       | New York        |
      | postalCode | 10001           |
      | country    | US              |
    When I transform the customer data to Segment format
    Then the transformed data should have userId "user@example.com"
    And the transformed data should have email "user@example.com" in traits
    And the transformed data should have name "John Doe" in traits
    And the transformed data should have address in traits:
      | street      | city      | postalCode | country |
      | 123 Main St | New York  | 10001      | US      |

  Scenario: Handle missing email field gracefully
    Given a Commercetools customer payload without email
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have email in traits

  Scenario: Handle missing name fields gracefully
    Given a Commercetools customer payload without name fields
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have name in traits

  Scenario: Handle missing address fields gracefully
    Given a Commercetools customer payload without address fields
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have address in traits

  Scenario: Handle null email field gracefully
    Given a Commercetools customer payload with null email
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have email in traits

  Scenario: Handle null name fields gracefully
    Given a Commercetools customer payload with null name fields
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have name in traits

  Scenario: Handle null address fields gracefully
    Given a Commercetools customer payload with null address fields
    When I transform the customer data to Segment format
    Then the transformation should complete without error
    And the transformed data should not have address in traits

  Scenario: Handle partial address fields
    Given a Commercetools customer payload with partial address:
      | street      | city      |
      | 123 Main St | New York  |
    When I transform the customer data to Segment format
    Then the transformed data should have address in traits:
      | street      | city      |
      | 123 Main St | New York  |
    And the transformed data address should not have postalCode
    And the transformed data address should not have country

  Scenario: Transform returns Segment Identify API compatible structure
    Given a Commercetools customer payload with email "test@example.com"
    When I transform the customer data to Segment format
    Then the transformed data should have structure compatible with Segment Identify API
    And the transformed data should have userId field
    And the transformed data should have traits field
    And the transformed data traits should have email field

  Scenario Outline: Transform customer with different name combinations
    Given a Commercetools customer payload with:
      | firstName | lastName | fullName |
      | <firstName> | <lastName> | <fullName> |
    When I transform the customer data to Segment format
    Then the transformed data should have name "<expectedName>" in traits

    Examples:
      | firstName | lastName | fullName | expectedName |
      | John      | Doe      |          | John Doe     |
      | Jane      |          |          | Jane         |
      |           | Smith    |          | Smith        |
      |           |          | John Doe | John Doe     |
      | John      | Doe      | Jane Smith | Jane Smith |

