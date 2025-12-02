Feature: Lambda Handler Migration for SNS Events
  As a developer
  I want the webhook handler migrated from Vercel to AWS Lambda
  So that the function can be invoked directly by SNS without HTTP round-trips

  Background:
    Given the Lambda handler is deployed and available
    And the Lambda handler is configured with valid Segment credentials

  Scenario: Lambda handler processes SNS event with customer.created payload
    Given an SNS event containing a Commercetools customer.created webhook payload
    When the Lambda handler processes the SNS event
    Then the handler should extract the Commercetools payload from the SNS Message field
    And the handler should process the customer.created event
    And the handler should return a successful response

  Scenario: Lambda handler processes SNS event with customer.updated payload
    Given an SNS event containing a Commercetools customer.updated webhook payload
    When the Lambda handler processes the SNS event
    Then the handler should extract the Commercetools payload from the SNS Message field
    And the handler should process the customer.updated event
    And the handler should return a successful response

  Scenario: Lambda handler processes SNS subscription confirmation request
    Given an SNS subscription confirmation event
    When the Lambda handler processes the SNS event
    Then the handler should identify the event as a subscription confirmation
    And the handler should handle the subscription confirmation request
    And the handler should return a successful response

  Scenario: Lambda handler extracts Commercetools payload from SNS Message field
    Given an SNS event with a Message field containing a valid Commercetools webhook payload
    When the Lambda handler processes the SNS event
    Then the handler should parse the JSON from the SNS Message field
    And the handler should extract the Commercetools payload
    And the extracted payload should be compatible with existing business logic

  Scenario: Lambda handler converts SNS event format to existing request format
    Given an SNS event with a Commercetools customer.created payload in the Message field
    When the Lambda handler processes the SNS event
    Then the handler should convert the SNS event to a format compatible with existing validator
    And the handler should convert the SNS event to a format compatible with existing transformer
    And the handler should convert the SNS event to a format compatible with existing integration service

  Scenario: Lambda handler processes customer data through existing business logic unchanged
    Given an SNS event containing a Commercetools customer.created webhook payload with:
      | field      | value           |
      | email      | lambda@example.com|
      | firstName  | Lambda          |
      | lastName   | Handler         |
    When the Lambda handler processes the SNS event
    Then the handler should validate the payload using the existing validator
    And the handler should transform the customer data using the existing transformer
    And the handler should send the data to Segment using the existing integration service
    And the customer should be created in Segment with userId "lambda@example.com"

  Scenario: Lambda handler handles SNS event with Notification message type
    Given an SNS event with Type "Notification" containing a Commercetools payload
    When the Lambda handler processes the SNS event
    Then the handler should identify the message type as Notification
    And the handler should extract and process the Commercetools payload
    And the handler should return a successful response

  Scenario: Lambda handler handles SNS event with SubscriptionConfirmation message type
    Given an SNS event with Type "SubscriptionConfirmation"
    When the Lambda handler processes the SNS event
    Then the handler should identify the message type as SubscriptionConfirmation
    And the handler should handle the subscription confirmation
    And the handler should return a successful response

  Scenario: Lambda handler processes SNS event with multiple records
    Given an SNS event with multiple Records containing Commercetools payloads
    When the Lambda handler processes the SNS event
    Then the handler should process each record in the SNS event
    And the handler should extract each Commercetools payload from the Message field
    And the handler should return a successful response

  Scenario: Lambda handler maintains compatibility with existing webhook processing logic
    Given an SNS event containing the same Commercetools payload that would be sent via HTTP webhook
    When the Lambda handler processes the SNS event
    Then the handler should produce the same validation result as the HTTP webhook handler
    And the handler should produce the same transformation result as the HTTP webhook handler
    And the handler should produce the same Segment integration result as the HTTP webhook handler

  Scenario: Lambda handler processes customer.updated event through complete flow
    Given an SNS event containing a Commercetools customer.updated webhook payload with:
      | field      | value           |
      | email      | update@example.com|
      | firstName  | Updated         |
      | lastName   | Customer        |
    When the Lambda handler processes the SNS event
    Then the handler should extract the Commercetools payload from the SNS Message field
    And the handler should validate the payload
    And the handler should transform the customer data
    And the handler should send the data to Segment
    And the customer should be updated in Segment with userId "update@example.com"

  Scenario Outline: Lambda handler processes different SNS event structures
    Given an SNS event with <description> containing a Commercetools customer.created payload
    When the Lambda handler processes the SNS event
    Then the handler should extract the Commercetools payload from the SNS Message field
    And the handler should process the event successfully

    Examples:
      | description                                    |
      | a single Record with Sns.Message field        |
      | a Record with nested Sns.Message JSON string   |
      | a Record with Sns.Type "Notification"          |



