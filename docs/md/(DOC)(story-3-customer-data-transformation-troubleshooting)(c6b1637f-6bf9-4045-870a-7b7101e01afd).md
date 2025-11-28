---
id: c6b1637f-6bf9-4045-870a-7b7101e01afd
title: STORY-3 Customer Data Transformation Troubleshooting
tags:
  - status/implemented
  - issue-3
  - topic/troubleshooting
  - story-3
category: DOC
created_at: '2025-11-28T09:31:53.879Z'
updated_at: '2025-11-28T09:34:39.296Z'
last_reviewed: '2025-11-28T09:31:53.879Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for customer data transformation - common issues,
  solutions, and debugging tips
---

# STORY-3 Customer Data Transformation Troubleshooting

## Common Issues and Solutions

### Issue 1: Empty userId in Output

**Symptom:**
```typescript
const result = transformCustomerToSegment(customer);
// result.userId === ''
```

**Cause:** Customer email is missing, null, or empty string

**Solution:**
- Check if `customer.email` is present and non-empty
- Verify email is not just whitespace (will be trimmed to empty)
- Consider validating email before transformation if userId is required

**Example:**
```typescript
if (!customer.email || customer.email.trim() === '') {
  console.warn('Customer missing email, userId will be empty');
}
const result = transformCustomerToSegment(customer);
```

### Issue 2: Name Not Appearing in Traits

**Symptom:**
```typescript
const result = transformCustomerToSegment(customer);
// result.traits.name === undefined
```

**Cause:** All name fields (fullName, firstName, lastName) are null/undefined/empty

**Solution:**
- Check if any name field is present: `customer.fullName`, `customer.firstName`, `customer.lastName`
- Verify fields are not just whitespace (will be trimmed)
- Name is optional in output, this is expected behavior if no name data exists

**Debug:**
```typescript
console.log('Name fields:', {
  fullName: customer.fullName,
  firstName: customer.firstName,
  lastName: customer.lastName,
});
```

### Issue 3: Address Not Appearing in Traits

**Symptom:**
```typescript
const result = transformCustomerToSegment(customer);
// result.traits.address === undefined
```

**Possible Causes:**
1. **No addresses array:** `customer.addresses` is null/undefined/empty
2. **All address fields null:** All fields in first address are null/empty
3. **Empty addresses array:** `customer.addresses` is empty array `[]`

**Solution:**
- Check if `customer.addresses` exists and has at least one element
- Verify at least one address field (street, city, postalCode, country) is non-null
- This is expected behavior if no address data exists

**Debug:**
```typescript
console.log('Addresses:', {
  hasAddresses: !!customer.addresses,
  addressesLength: customer.addresses?.length ?? 0,
  firstAddress: customer.addresses?.[0],
});
```

### Issue 4: Wrong Name in Output

**Symptom:**
```typescript
// Expected: 'John Doe'
// Actual: 'Jane Smith'
```

**Cause:** fullName takes priority over firstName+lastName

**Explanation:**
Name priority is: fullName > firstName+lastName > firstName > lastName

**Solution:**
- If you want firstName+lastName, ensure fullName is null/undefined
- If fullName exists and is non-empty, it will always be used

**Example:**
```typescript
// This will use fullName, not 'John Doe'
const customer = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'Jane Smith', // Takes priority
};
```

### Issue 5: Street Field Missing Street Number

**Symptom:**
```typescript
// Expected: 'Main St 123'
// Actual: 'Main St'
```

**Cause:** `streetNumber` is null/undefined in address

**Solution:**
- Check if `address.streetNumber` is present
- If only streetName exists, only streetName will be used
- This is expected behavior when streetNumber is missing

**Debug:**
```typescript
const address = customer.addresses?.[0];
console.log('Address fields:', {
  streetName: address?.streetName,
  streetNumber: address?.streetNumber,
});
```

### Issue 6: Type Errors

**Symptom:**
```typescript
// TypeScript error: Type 'string' is not assignable to type 'string | null | undefined'
```

**Cause:** Type mismatch between Commercetools data and expected types

**Solution:**
- Ensure customer data matches `CommercetoolsCustomer` interface
- Use type assertion if data comes from external source: `customer as CommercetoolsCustomer`
- Verify all fields are properly typed

**Example:**
```typescript
import type { CommercetoolsCustomer } from './transformation/types.js';

// Type assertion for external data
const customer = externalData as CommercetoolsCustomer;
const result = transformCustomerToSegment(customer);
```

## Debugging Tips

### 1. Log Input Data

```typescript
console.log('Input customer:', JSON.stringify(customer, null, 2));
const result = transformCustomerToSegment(customer);
console.log('Output payload:', JSON.stringify(result, null, 2));
```

### 2. Check Individual Fields

```typescript
console.log('Email:', customer.email);
console.log('Name fields:', {
  fullName: customer.fullName,
  firstName: customer.firstName,
  lastName: customer.lastName,
});
console.log('Addresses:', customer.addresses);
```

### 3. Validate Before Transformation

```typescript
function validateCustomer(customer: CommercetoolsCustomer): void {
  if (!customer.email || customer.email.trim() === '') {
    console.warn('Warning: Customer missing email');
  }
  if (!customer.fullName && !customer.firstName && !customer.lastName) {
    console.warn('Warning: Customer missing all name fields');
  }
  if (!customer.addresses || customer.addresses.length === 0) {
    console.warn('Warning: Customer missing addresses');
  }
}

validateCustomer(customer);
const result = transformCustomerToSegment(customer);
```

### 4. Test Edge Cases

```typescript
// Test with minimal data
const minimalCustomer: CommercetoolsCustomer = {
  email: 'test@example.com',
  firstName: null,
  lastName: null,
  fullName: null,
  addresses: null,
};

// Test with all fields
const fullCustomer: CommercetoolsCustomer = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  addresses: [{
    streetName: 'Main St',
    streetNumber: '123',
    city: 'New York',
    postalCode: '10001',
    country: 'US',
  }],
};
```

## Error Handling

### Function Never Throws

The `transformCustomerToSegment` function is designed to never throw errors. It handles all edge cases gracefully:

- Missing email → empty string
- Missing name → undefined (omitted)
- Missing address → undefined (omitted)
- Null values → handled gracefully
- Empty strings → handled gracefully

### Handling Empty userId

If userId is empty string, downstream systems should handle appropriately:

```typescript
const result = transformCustomerToSegment(customer);
if (result.userId === '') {
  // Handle missing email case
  console.warn('Customer missing email, cannot identify user');
  // Option: Skip Segment identify call
  // Option: Use alternative identifier
  // Option: Log for manual review
}
```

## Best Practices

1. **Validate Input:** Check customer data before transformation if userId is required
2. **Handle Empty userId:** Implement logic to handle empty userId in downstream systems
3. **Log Warnings:** Log warnings for missing critical fields (email)
4. **Test Edge Cases:** Test with null, undefined, and empty values
5. **Type Safety:** Use TypeScript types to catch errors at compile time

## Testing

Run tests to verify behavior:

```bash
# Run unit tests
pnpm test tests/transformation/transformer.test.ts

# Run BDD tests
pnpm test:bdd

# Run all tests
pnpm test:all
```

## Getting Help

If issues persist:
1. Check test cases in `tests/transformation/transformer.test.ts` for expected behavior
2. Review BDD scenarios in `features/story-3-customer-data-transformation.feature`
3. Check API documentation for field mapping rules
4. Review architecture documentation for design decisions