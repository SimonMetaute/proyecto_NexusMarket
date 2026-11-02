/**
 * Role authorization middleware.
 *
 * Must run after `createAuthMiddleware`. Compares the canonical role carried by
 * the validated token against the roles allowed by the endpoint:
 *   - no claims            -> `401 AUTHENTICATION_REQUIRED`
 *   - insufficient role    -> `403 FORBIDDEN`
 *
 * SDD/Adapters/Api-rest-endpoints.md §2.
 */
import type { RequestHandler } from 'express';
import { resolveUserRole } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';

export function requireRole(...allowedRoles: string[]): RequestHandler {
  const allowed = new Set(allowedRoles.map((role) => resolveUserRole(role)));

  return (req, _res, next): void => {
    const claims = req.authClaims;
    if (claims === undefined) {
      next(ApiError.authenticationRequired());
      return;
    }

    const claimedRole = claims.role ?? claims.userType;
    if (claimedRole === undefined || claimedRole === null) {
      next(ApiError.forbidden('Token does not declare an authorization role'));
      return;
    }

    const actualRole = resolveUserRole(String(claimedRole));
    if (!allowed.has(actualRole)) {
      next(ApiError.forbidden());
      return;
    }

    next();
  };
}
