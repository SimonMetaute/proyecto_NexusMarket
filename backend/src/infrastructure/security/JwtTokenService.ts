/**
 * Adapter: JwtTokenService.
 *
 * Implements the outbound `JwtServicePort` with HS256-signed JSON Web Tokens.
 * The payload follows `SDD/Adapters/Api-rest-endpoints.md` §2:
 *
 *   { userId, username, email, role, identification, iat, exp }
 *
 * Revocation is kept in memory. This is intentionally a development-grade
 * mechanism: a multi-instance deployment MUST replace it with a shared store
 * (for example Redis or a `revoked_tokens` table) before going live.
 */
import jwt from 'jsonwebtoken';
import type {
  AccessToken,
  JwtServicePort,
  TokenClaims,
} from '../../domain/ports/out/JwtServicePort.js';
import type { User } from '../../domain/model/user.js';
import { deriveUsername, resolveUserRole } from '../../domain/model/user.js';
import { appConfig } from '../config/appConfig.js';
import { ApiError } from '../http/errors/ApiError.js';

interface DecodedToken extends jwt.JwtPayload {
  userId?: unknown;
  role?: unknown;
}

export class JwtTokenService implements JwtServicePort {
  private readonly secret: string;
  private readonly expiresInSeconds: number;
  /** token -> epoch millis at which the entry can be discarded. */
  private readonly revokedTokens = new Map<string, number>();

  constructor(
    secret: string = appConfig.security.jwtSecret,
    expiresInSeconds: number = appConfig.security.jwtExpiresInSeconds,
  ) {
    this.secret = secret;
    this.expiresInSeconds = expiresInSeconds;
  }

  async generate(user: User): Promise<AccessToken> {
    const payload: TokenClaims = {
      userId: user.userId,
      userType: user.userType,
      role: resolveUserRole(user.userType),
      username: deriveUsername(user.email),
      email: user.email,
      identification: user.identityDocument.number,
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresInSeconds });
  }

  async validate(token: AccessToken): Promise<TokenClaims> {
    this.pruneRevoked();

    if (this.revokedTokens.has(token)) {
      throw ApiError.authenticationRequired('Token has been revoked');
    }

    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, this.secret);
    } catch {
      throw ApiError.authenticationRequired();
    }

    if (typeof decoded === 'string') {
      throw ApiError.authenticationRequired();
    }

    const candidate = decoded as DecodedToken;
    if (typeof candidate.userId !== 'string' || candidate.userId.length === 0) {
      throw ApiError.authenticationRequired('Token is missing the userId claim');
    }

    return candidate as TokenClaims;
  }

  async revoke(token: AccessToken): Promise<void> {
    let expiresAt = Date.now() + this.expiresInSeconds * 1000;
    try {
      const decoded = jwt.decode(token);
      if (decoded !== null && typeof decoded !== 'string' && typeof decoded.exp === 'number') {
        expiresAt = decoded.exp * 1000;
      }
    } catch {
      // Malformed tokens are still tracked so they cannot be replayed.
    }

    this.revokedTokens.set(token, expiresAt);
  }

  private pruneRevoked(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.revokedTokens) {
      if (expiresAt <= now) {
        this.revokedTokens.delete(token);
      }
    }
  }
}
