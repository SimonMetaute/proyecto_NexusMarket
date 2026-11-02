/**
 * Service Port: JwtServicePort
 * Source: SDD/Domain/output-ports.md (Section 4.17)
 */

import type { User } from '../../model/user.js';

export type AccessToken = string;

/**
 * Validated JWT claims.
 *
 * Source of truth: SDD/Adapters/Api-rest-endpoints.md §2 "JWT Token Payload".
 * `role` is the canonical authorization role; `userType` is kept for backward
 * compatibility with tokens issued before the role alignment.
 */
export interface TokenClaims {
  userId: string;
  userType?: string;
  role?: string;
  username?: string;
  email?: string;
  identification?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export interface JwtServicePort {
  generate(user: User): Promise<AccessToken>;
  validate(token: AccessToken): Promise<TokenClaims>;
  revoke(token: AccessToken): Promise<void>;
}
