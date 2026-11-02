/**
 * Authentication middleware.
 *
 * Resolves the bearer token through `JwtServicePort`, loads the authenticated
 * actor through `UserRepository`, and exposes both on the request:
 *   - `req.user`:       the `User` domain model expected by input ports.
 *   - `req.authClaims`: the validated token claims used for authorization.
 *
 * SDD/Adapters/Api-rest-endpoints.md §2: missing/invalid tokens produce
 * `401 AUTHENTICATION_REQUIRED`.
 */
import type { Request, RequestHandler } from 'express';
import type { JwtServicePort } from '../../../domain/ports/out/JwtServicePort.js';
import type { UserRepository } from '../../../domain/ports/out/UserRepository.js';
import { ApiError } from '../errors/ApiError.js';

export interface AuthMiddlewareDependencies {
  jwtService: JwtServicePort;
  userRepository: UserRepository;
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

/**
 * Extracts the raw token from an `Authorization: Bearer <token>` header.
 * Shared with the logout endpoint so both paths parse it identically.
 */
export function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  const match = header === undefined ? null : BEARER_PATTERN.exec(header.trim());
  if (match === null || match[1] === undefined) {
    return null;
  }
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export function createAuthMiddleware(dependencies: AuthMiddlewareDependencies): RequestHandler {
  const { jwtService, userRepository } = dependencies;

  return (req, _res, next): void => {
    void (async () => {
      const token = extractBearerToken(req);
      if (token === null) {
        throw ApiError.authenticationRequired();
      }

      const claims = await jwtService.validate(token);

      const user = await userRepository.findById(claims.userId);
      if (user === null) {
        throw ApiError.authenticationRequired('The authenticated user no longer exists');
      }

      req.user = user;
      req.authClaims = claims;
      next();
    })().catch(next);
  };
}
