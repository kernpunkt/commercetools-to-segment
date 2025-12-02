Feature: End-to-End Integration Testing
  As a developer
  I want to test the complete flow from Commercetools webhook to Segment user creation/update
  So that I can verify the integration works correctly end-to-end

  Background:
    Given the webhook endpoint is available at "/api/webhook"
    And the Segment integration is configured with valid credentials
    And the data transformation service is available

  Scenario: Complete flow for customer.created event creates user in Segment
    Given a valid Commercetools customer.created webhook payload with:
      | field      | value           |
      | email      | newuser@example.com|
      | firstName  | John            |
      | lastName   | Doe             |
      | street     | 123 Main St     |
      | city       | New York        |
      | postalCode | 10001           |
      | country    | US              |
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be created in Segment with userId "newuser@example.com"
    And the customer in Segment should have email "newuser@example.com" in traits
    And the customer in Segment should have name "John Doe" in traits
    And the customer in Segment should have address in traits:
      | street      | city      | postalCode | country |
      | 123 Main St | New York  | 10001      | US      |

  Scenario: Complete flow for customer.updated event updates user in Segment
    Given a valid Commercetools customer.updated webhook payload with:
      | field      | value           |
      | email      | existing@example.com|
      | firstName  | Jane            |
      | lastName   | Smith           |
      | street     | 456 Oak Ave     |
      | city       | Los Angeles     |
      | postalCode | 90001           |
      | country    | US              |
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be updated in Segment with userId "existing@example.com"
    And the customer in Segment should have email "existing@example.com" in traits
    And the customer in Segment should have name "Jane Smith" in traits
    And the customer in Segment should have address in traits:
      | street     | city        | postalCode | country |
      | 456 Oak Ave| Los Angeles | 90001      | US      |

  Scenario: User is identified by email in Segment
    Given a valid Commercetools customer.created webhook payload with email "user@example.com"
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be identified in Segment with userId "user@example.com"
    And the userId in Segment should match the email "user@example.com"

  Scenario: All three fields (email, name, address) are correctly synced to Segment
    Given a valid Commercetools customer.created webhook payload with:
      | field      | value           |
      | email      | complete@example.com|
      | firstName  | Alice            |
      | lastName   | Johnson          |
      | street     | 789 Pine Rd     |
      | city       | Chicago         |
      | postalCode | 60601           |
      | country    | US              |
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer in Segment should have email "complete@example.com" in traits
    And the customer in Segment should have name "Alice Johnson" in traits
    And the customer in Segment should have address in traits:
      | street     | city    | postalCode | country |
      | 789 Pine Rd| Chicago | 60601      | US      |

  Scenario: Complete flow processes customer.created event end-to-end
    Given a valid Commercetools customer.created webhook payload with email "test@example.com"
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the response should indicate success
    And the customer should appear in Segment
    And the customer should be identified by email "test@example.com"

  Scenario: Complete flow processes customer.updated event end-to-end
    Given a valid Commercetools customer.updated webhook payload with email "update@example.com"
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the response should indicate success
    And the customer should appear in Segment
    And the customer should be identified by email "update@example.com"

  Scenario: Data flows correctly from webhook through transformation to Segment
    Given a valid Commercetools customer.created webhook payload with:
      | field      | value           |
      | email      | flow@example.com|
      | firstName  | Bob             |
      | lastName   | Williams        |
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer data should be transformed correctly
    And the transformed data should be sent to Segment
    And the customer should be created in Segment with userId "flow@example.com"
    And the customer in Segment should have name "Bob Williams" in traits

  Scenario Outline: Complete flow works with different customer data combinations
    Given a valid Commercetools customer.created webhook payload with:
      | field      | value           |
      | email      | <email>         |
      | firstName  | <firstName>     |
      | lastName   | <lastName>      |
      | street     | <street>        |
      | city       | <city>          |
      | postalCode | <postalCode>    |
      | country    | <country>       |
    When I send the webhook payload to the webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be created in Segment with userId "<email>"
    And the customer in Segment should have email "<email>" in traits
    And the customer in Segment should have name "<expectedName>" in traits
    And the customer in Segment should have address in traits:
      | street      | city      | postalCode | country |
      | <street>    | <city>    | <postalCode>| <country>|

    Examples:
      | email              | firstName | lastName | street      | city      | postalCode | country | expectedName |
      | user1@example.com | John      | Doe      | 123 Main St | New York  | 10001      | US      | John Doe     |
      | user2@example.com | Jane      | Smith    | 456 Oak Ave | Los Angeles| 90001     | US      | Jane Smith   |
      | user3@example.com | Bob       | Jones    | 789 Elm St  | Chicago   | 60601      | US      | Bob Jones    |

  Scenario: Integration can be tested locally
    Given the application is running locally
    And a valid Commercetools customer.created webhook payload with email "local@example.com"
    When I send the webhook payload to the local webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be created in Segment with userId "local@example.com"

  Scenario: Integration can be tested on Vercel
    Given the application is deployed on Vercel
    And a valid Commercetools customer.created webhook payload with email "vercel@example.com"
    When I send the webhook payload to the Vercel webhook endpoint
    Then the webhook endpoint should return HTTP status 200
    And the customer should be created in Segment with userId "vercel@example.com"


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes

