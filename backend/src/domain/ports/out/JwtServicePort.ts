/**
 * Service Port: JwtServicePort
 * Source: SDD/Domain/output-ports.md (Section 4.17)
 */

import type { User } from '../../model/user.js';

export type AccessToken = string;

export interface TokenClaims {
  userId: string;
  userType: string;
  [key: string]: any;
}

export interface JwtServicePort {
  generate(user: User): Promise<AccessToken>;
  validate(token: AccessToken): Promise<TokenClaims>;
  revoke(token: AccessToken): Promise<void>;
}
