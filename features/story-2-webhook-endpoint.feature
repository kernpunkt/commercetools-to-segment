Feature: Webhook Endpoint for Commercetools Events
  As a developer
  I want a webhook endpoint that receives POST requests from Commercetools subscription API
  So that I can process customer.created and customer.updated events

  Background:
    Given the webhook endpoint is available at "/api/webhook"

  Scenario: Accept valid customer.created event
    Given a valid Commercetools customer.created webhook payload
    When I send a POST request to the webhook endpoint
    Then the endpoint should return HTTP status 200
    And the endpoint should identify the event as customer.created

  Scenario: Accept valid customer.updated event
    Given a valid Commercetools customer.updated webhook payload
    When I send a POST request to the webhook endpoint
    Then the endpoint should return HTTP status 200
    And the endpoint should identify the event as customer.updated

  Scenario: Reject non-POST requests
    Given a valid Commercetools webhook payload
    When I send a GET request to the webhook endpoint
    Then the endpoint should return HTTP status 400

  Scenario Outline: Reject invalid request methods
    Given a valid Commercetools webhook payload
    When I send a <method> request to the webhook endpoint
    Then the endpoint should return HTTP status 400

    Examples:
      | method |
      | GET    |
      | PUT    |
      | DELETE |
      | PATCH  |

  Scenario: Reject request with missing body
    Given no request body is provided
    When I send a POST request to the webhook endpoint
    Then the endpoint should return HTTP status 400

  Scenario: Reject request with invalid JSON
    Given an invalid JSON payload
    When I send a POST request to the webhook endpoint
    Then the endpoint should return HTTP status 400

  Scenario: Reject request with malformed payload structure
    Given a JSON payload with missing required fields
    When I send a POST request to the webhook endpoint
    Then the endpoint should return HTTP status 400

