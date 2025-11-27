/**
 * Segment Analytics Client Type Definitions
 */

export interface Address {
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
  readonly postalCode?: string;
}

export interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}

export interface SegmentClient {
  identify(params: { userId: string; traits: UserTraits }): Promise<void>;
  flush(): Promise<void>;
  closeAndFlush(): Promise<void>;
}

