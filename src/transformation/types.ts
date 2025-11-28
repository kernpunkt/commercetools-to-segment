/**
 * Commercetools Customer Data Types
 */

export interface CommercetoolsAddress {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}

export interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}

import type { UserTraits } from '../segment/types.js';

export interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
