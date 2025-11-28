import { describe, it, expect } from 'vitest';
import { transformCustomerToSegment } from '../../src/transformation/transformer.js';
import type {
  CommercetoolsCustomer,
  CommercetoolsAddress,
} from '../../src/transformation/types.js';
import type { UserTraits } from '../../src/segment/types.js';

describe('transformCustomerToSegment', () => {
  describe('Email extraction', () => {
    it('should extract email as userId and traits.email when email is provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('user@example.com');
      expect(result.traits.email).toBe('user@example.com');
    });

    it('should handle customer with email and other fields', () => {
      const customer: CommercetoolsCustomer = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('test@example.com');
      expect(result.traits.email).toBe('test@example.com');
    });

    it('should handle missing email gracefully with empty string', () => {
      const customer: CommercetoolsCustomer = {
        email: null,
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });

    it('should handle undefined email gracefully with empty string', () => {
      const customer: CommercetoolsCustomer = {
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });

    it('should handle empty string email gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: '',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });
  });

  describe('Name extraction', () => {
    it('should use fullName when fullName is provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'Jane Smith',
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBe('Jane Smith');
    });

    it('should combine firstName and lastName when fullName is not provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBe('John Doe');
    });

    it('should use firstName only when lastName is not provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBe('Jane');
    });

    it('should use lastName only when firstName is not provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: 'Smith',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBe('Smith');
    });

    it('should omit name from traits when all name fields are null', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBeUndefined();
    });

    it('should omit name from traits when all name fields are undefined', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBeUndefined();
    });

    it('should prefer fullName over firstName+lastName when both are provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'Override Name',
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBe('Override Name');
    });
  });

  describe('Address extraction', () => {
    it('should extract complete address from first address when all fields are provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
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

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeDefined();
      expect(result.traits.address?.street).toBe('Main St 123');
      expect(result.traits.address?.city).toBe('New York');
      expect(result.traits.address?.postalCode).toBe('10001');
      expect(result.traits.address?.country).toBe('US');
    });

    it('should combine streetName and streetNumber into street field', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: 'Oak Avenue',
            streetNumber: '456',
            city: 'San Francisco',
            postalCode: '94102',
            country: 'USA',
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address?.street).toBe('Oak Avenue 456');
    });

    it('should use streetName only when streetNumber is not provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: 'Broadway',
            streetNumber: null,
            city: 'Los Angeles',
            postalCode: null,
            country: null,
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address?.street).toBe('Broadway');
    });

    it('should use streetNumber only when streetName is not provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: null,
            streetNumber: '789',
            city: 'Chicago',
            postalCode: null,
            country: null,
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address?.street).toBe('789');
    });

    it('should extract partial address when only some fields are provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: '123 Main St',
            streetNumber: null,
            city: 'New York',
            postalCode: null,
            country: null,
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeDefined();
      expect(result.traits.address?.street).toBe('123 Main St');
      expect(result.traits.address?.city).toBe('New York');
      expect(result.traits.address?.postalCode).toBeUndefined();
      expect(result.traits.address?.country).toBeUndefined();
    });

    it('should omit address from traits when addresses array is null', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeUndefined();
    });

    it('should omit address from traits when addresses array is empty', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeUndefined();
    });

    it('should use first address when multiple addresses are provided', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: 'First St',
            streetNumber: '1',
            city: 'First City',
            postalCode: '11111',
            country: 'US',
          },
          {
            streetName: 'Second St',
            streetNumber: '2',
            city: 'Second City',
            postalCode: '22222',
            country: 'CA',
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeDefined();
      expect(result.traits.address?.street).toBe('First St 1');
      expect(result.traits.address?.city).toBe('First City');
      expect(result.traits.address?.postalCode).toBe('11111');
      expect(result.traits.address?.country).toBe('US');
    });

    it('should handle address with null fields gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: [
          {
            streetName: null,
            streetNumber: null,
            city: null,
            postalCode: null,
            country: null,
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      // When all address fields are null, address should be undefined
      expect(result.traits.address).toBeUndefined();
    });
  });

  describe('All fields combined', () => {
    it('should transform customer with email, name, and address correctly', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
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

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('user@example.com');
      expect(result.traits.email).toBe('user@example.com');
      expect(result.traits.name).toBe('John Doe');
      expect(result.traits.address).toBeDefined();
      expect(result.traits.address?.street).toBe('Main St 123');
      expect(result.traits.address?.city).toBe('New York');
      expect(result.traits.address?.postalCode).toBe('10001');
      expect(result.traits.address?.country).toBe('US');
    });

    it('should transform customer with email, fullName, and address correctly', () => {
      const customer: CommercetoolsCustomer = {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane A. Smith',
        addresses: [
          {
            streetName: 'Oak Avenue',
            streetNumber: '456',
            city: 'San Francisco',
            postalCode: '94102',
            country: 'USA',
          },
        ],
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('jane@example.com');
      expect(result.traits.email).toBe('jane@example.com');
      expect(result.traits.name).toBe('Jane A. Smith');
      expect(result.traits.address?.street).toBe('Oak Avenue 456');
      expect(result.traits.address?.city).toBe('San Francisco');
    });
  });

  describe('Missing fields handling', () => {
    it('should handle missing email field gracefully', () => {
      const customer: CommercetoolsCustomer = {
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });

    it('should handle missing name fields gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBeUndefined();
    });

    it('should handle missing address fields gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeUndefined();
    });
  });

  describe('Null fields handling', () => {
    it('should handle null email field gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: null,
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });

    it('should handle null name fields gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.name).toBeUndefined();
    });

    it('should handle null address fields gracefully', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits.address).toBeUndefined();
    });
  });

  describe('Return structure', () => {
    it('should return Segment Identify API compatible structure', () => {
      const customer: CommercetoolsCustomer = {
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('traits');
      expect(typeof result.userId).toBe('string');
      expect(typeof result.traits).toBe('object');
      expect(result.traits).toHaveProperty('email');
      expect(typeof result.traits.email).toBe('string');
    });

    it('should return userId as string', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(typeof result.userId).toBe('string');
      expect(result.userId.length).toBeGreaterThan(0);
    });

    it('should return traits with email field', () => {
      const customer: CommercetoolsCustomer = {
        email: 'user@example.com',
        firstName: null,
        lastName: null,
        fullName: null,
        addresses: null,
      };

      const result = transformCustomerToSegment(customer);

      expect(result.traits).toHaveProperty('email');
      expect(typeof result.traits.email).toBe('string');
    });
  });
});

