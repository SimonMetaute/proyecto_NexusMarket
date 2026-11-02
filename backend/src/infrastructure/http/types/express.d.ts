/**
 * Express request augmentation.
 *
 * `user` is the domain `User` reconstructed by the authentication middleware
 * from the JWT claims (per SDD: ports receive the `User` domain model).
 * `authClaims` keeps the raw validated token claims for role checks.
 */
import type { User } from '../../../domain/model/user.js';
import type { TokenClaims } from '../../../domain/ports/out/JwtServicePort.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: User;
      authClaims?: TokenClaims;
    }
  }
}

export {};
