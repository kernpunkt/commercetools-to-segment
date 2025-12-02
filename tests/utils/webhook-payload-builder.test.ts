import { describe, it, expect } from 'vitest';
import {
  createCustomerCreatedPayload,
  createCustomerUpdatedPayload,
  createCustomerCreatedPayloadWithEmail,
  createCustomerUpdatedPayloadWithEmail,
  createPayloadFromDataTable,
  parseDataTable,
} from './webhook-payload-builder.js';

describe('webhook-payload-builder', () => {
  describe('createCustomerCreatedPayload', () => {
    it('should create payload with CustomerCreated type when no customer provided', () => {
      const payload = createCustomerCreatedPayload();

      expect(payload.type).toBe('CustomerCreated');
      expect(payload.notificationType).toBe('Message');
      expect(payload.customer).toBeDefined();
    });

    it('should create payload with provided customer data', () => {
      const customer = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const payload = createCustomerCreatedPayload(customer);

      expect(payload.customer.email).toBe('test@example.com');
      expect(payload.customer.firstName).toBe('John');
      expect(payload.customer.lastName).toBe('Doe');
    });

    it('should create payload with customer address when provided', () => {
      const customer = {
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: 'Main St',
            streetNumber: '123',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
          },
        ],
      };

      const payload = createCustomerCreatedPayload(customer);

      expect(payload.customer.addresses).toBeDefined();
      expect(payload.customer.addresses?.[0]?.streetName).toBe('Main St');
      expect(payload.customer.addresses?.[0]?.city).toBe('New York');
    });

    it('should create payload with required webhook fields', () => {
      const payload = createCustomerCreatedPayload();

      expect(payload.resource.typeId).toBe('customer');
      expect(payload.resource.id).toBeDefined();
      expect(payload.projectKey).toBe('test-project');
      expect(payload.id).toBeDefined();
      expect(payload.version).toBe(1);
      expect(payload.sequenceNumber).toBe(1);
      expect(payload.resourceVersion).toBe(1);
      expect(payload.createdAt).toBeDefined();
      expect(payload.lastModifiedAt).toBeDefined();
    });

    it('should generate unique IDs for each payload', () => {
      const payload1 = createCustomerCreatedPayload();
      const payload2 = createCustomerCreatedPayload();

      expect(payload1.id).not.toBe(payload2.id);
      expect(payload1.resource.id).not.toBe(payload2.resource.id);
    });

    it('should use ISO timestamp for createdAt and lastModifiedAt', () => {
      const payload = createCustomerCreatedPayload();

      expect(payload.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(payload.lastModifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('createCustomerUpdatedPayload', () => {
    it('should create payload with CustomerUpdated type when no customer provided', () => {
      const payload = createCustomerUpdatedPayload();

      expect(payload.type).toBe('CustomerUpdated');
      expect(payload.notificationType).toBe('Message');
      expect(payload.customer).toBeDefined();
    });

    it('should create payload with provided customer data', () => {
      const customer = {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: null,
        addresses: null,
      };

      const payload = createCustomerUpdatedPayload(customer);

      expect(payload.customer.email).toBe('updated@example.com');
      expect(payload.customer.firstName).toBe('Jane');
      expect(payload.customer.lastName).toBe('Smith');
    });

    it('should create payload with version 2 and sequenceNumber 2', () => {
      const payload = createCustomerUpdatedPayload();

      expect(payload.version).toBe(2);
      expect(payload.sequenceNumber).toBe(2);
      expect(payload.resourceVersion).toBe(2);
    });

    it('should generate unique IDs for each payload', () => {
      const payload1 = createCustomerUpdatedPayload();
      const payload2 = createCustomerUpdatedPayload();

      expect(payload1.id).not.toBe(payload2.id);
      expect(payload1.resource.id).not.toBe(payload2.resource.id);
    });
  });

  describe('createCustomerCreatedPayloadWithEmail', () => {
    it('should create CustomerCreated payload with email', () => {
      const email = 'user@example.com';
      const payload = createCustomerCreatedPayloadWithEmail(email);

      expect(payload.type).toBe('CustomerCreated');
      expect(payload.customer.email).toBe(email);
    });

    it('should create payload with different email addresses', () => {
      const payload1 = createCustomerCreatedPayloadWithEmail('user1@example.com');
      const payload2 = createCustomerCreatedPayloadWithEmail('user2@example.com');

      expect(payload1.customer.email).toBe('user1@example.com');
      expect(payload2.customer.email).toBe('user2@example.com');
    });

    it('should create payload with null name fields when only email provided', () => {
      const payload = createCustomerCreatedPayloadWithEmail('test@example.com');

      expect(payload.customer.firstName).toBeNull();
      expect(payload.customer.lastName).toBeNull();
      expect(payload.customer.fullName).toBeNull();
    });
  });

  describe('createCustomerUpdatedPayloadWithEmail', () => {
    it('should create CustomerUpdated payload with email', () => {
      const email = 'updated@example.com';
      const payload = createCustomerUpdatedPayloadWithEmail(email);

      expect(payload.type).toBe('CustomerUpdated');
      expect(payload.customer.email).toBe(email);
    });

    it('should create payload with different email addresses', () => {
      const payload1 = createCustomerUpdatedPayloadWithEmail('user1@example.com');
      const payload2 = createCustomerUpdatedPayloadWithEmail('user2@example.com');

      expect(payload1.customer.email).toBe('user1@example.com');
      expect(payload2.customer.email).toBe('user2@example.com');
    });
  });

  describe('parseDataTable', () => {
    it('should parse key-value format data table', () => {
      const dataTable = {
        rawTable: [
          ['field', 'value'],
          ['email', 'test@example.com'],
          ['firstName', 'John'],
          ['lastName', 'Doe'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.email).toBe('test@example.com');
      expect(fields.firstName).toBe('John');
      expect(fields.lastName).toBe('Doe');
    });

    it('should parse column format data table', () => {
      const dataTable = {
        rawTable: [
          ['email', 'firstName', 'lastName'],
          ['test@example.com', 'John', 'Doe'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.email).toBe('test@example.com');
      expect(fields.firstName).toBe('John');
      expect(fields.lastName).toBe('Doe');
    });

    it('should parse address fields from key-value format', () => {
      const dataTable = {
        rawTable: [
          ['field', 'value'],
          ['email', 'user@example.com'],
          ['street', '123 Main St'],
          ['city', 'New York'],
          ['postalCode', '10001'],
          ['country', 'US'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.street).toBe('123 Main St');
      expect(fields.city).toBe('New York');
      expect(fields.postalCode).toBe('10001');
      expect(fields.country).toBe('US');
    });

    it('should parse address fields from column format', () => {
      const dataTable = {
        rawTable: [
          ['email', 'street', 'city', 'postalCode', 'country'],
          ['user@example.com', '456 Oak Ave', 'Los Angeles', '90001', 'US'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.street).toBe('456 Oak Ave');
      expect(fields.city).toBe('Los Angeles');
      expect(fields.postalCode).toBe('90001');
      expect(fields.country).toBe('US');
    });

    it('should parse fullName field when provided', () => {
      const dataTable = {
        rawTable: [
          ['field', 'value'],
          ['email', 'test@example.com'],
          ['fullName', 'John Doe'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.fullName).toBe('John Doe');
    });

    it('should throw error when data table has less than 2 rows', () => {
      const dataTable = {
        rawTable: [['field', 'value']],
      };

      expect(() => parseDataTable(dataTable)).toThrow(
        'Data table must have header and at least one row'
      );
    });

    it('should handle missing fields gracefully', () => {
      const dataTable = {
        rawTable: [
          ['field', 'value'],
          ['email', 'test@example.com'],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.email).toBe('test@example.com');
      expect(fields.firstName).toBeUndefined();
      expect(fields.lastName).toBeUndefined();
    });

    it('should handle empty data table rows', () => {
      const dataTable = {
        rawTable: [
          ['email', 'firstName'],
          ['test@example.com', ''],
        ],
      };

      const fields = parseDataTable(dataTable);

      expect(fields.email).toBe('test@example.com');
      expect(fields.firstName).toBe('');
    });
  });

  describe('createPayloadFromDataTable', () => {
    it('should create CustomerCreated payload from data table fields', () => {
      const fields = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        eventType: 'customer.created' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.type).toBe('CustomerCreated');
      expect(payload.customer.email).toBe('test@example.com');
      expect(payload.customer.firstName).toBe('John');
      expect(payload.customer.lastName).toBe('Doe');
    });

    it('should create CustomerUpdated payload from data table fields', () => {
      const fields = {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        eventType: 'customer.updated' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.type).toBe('CustomerUpdated');
      expect(payload.customer.email).toBe('updated@example.com');
      expect(payload.customer.firstName).toBe('Jane');
      expect(payload.customer.lastName).toBe('Smith');
    });

    it('should default to customer.created when eventType not provided', () => {
      const fields = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.type).toBe('CustomerCreated');
    });

    it('should create payload with address from data table fields', () => {
      const fields = {
        email: 'user@example.com',
        street: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
        eventType: 'customer.created' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.customer.addresses).toBeDefined();
      expect(payload.customer.addresses?.[0]?.streetName).toBe('123 Main St');
      expect(payload.customer.addresses?.[0]?.city).toBe('New York');
      expect(payload.customer.addresses?.[0]?.postalCode).toBe('10001');
      expect(payload.customer.addresses?.[0]?.country).toBe('US');
    });

    it('should create payload with fullName when provided', () => {
      const fields = {
        email: 'test@example.com',
        fullName: 'John A. Doe',
        eventType: 'customer.created' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.customer.fullName).toBe('John A. Doe');
    });

    it('should handle partial address fields', () => {
      const fields = {
        email: 'user@example.com',
        street: '123 Main St',
        city: 'New York',
        eventType: 'customer.created' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.customer.addresses).toBeDefined();
      expect(payload.customer.addresses?.[0]?.streetName).toBe('123 Main St');
      expect(payload.customer.addresses?.[0]?.city).toBe('New York');
      expect(payload.customer.addresses?.[0]?.postalCode).toBeNull();
      expect(payload.customer.addresses?.[0]?.country).toBeNull();
    });

    it('should handle customer with only email', () => {
      const fields = {
        email: 'minimal@example.com',
        eventType: 'customer.created' as const,
      };

      const payload = createPayloadFromDataTable(fields);

      expect(payload.customer.email).toBe('minimal@example.com');
      expect(payload.customer.firstName).toBeNull();
      expect(payload.customer.lastName).toBeNull();
      expect(payload.customer.addresses).toBeNull();
    });
  });
});



