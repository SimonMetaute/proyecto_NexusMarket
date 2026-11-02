/**
 * Adapter: BcryptPasswordService.
 *
 * Implements the outbound `PasswordServicePort` using bcrypt. The salt cost is
 * configuration-driven (`BCRYPT_SALT_ROUNDS`) so production deployments can
 * raise it without touching application code.
 */
import bcrypt from 'bcrypt';
import type {
  PasswordHash,
  PasswordServicePort,
  PlainPassword,
} from '../../domain/ports/out/PasswordServicePort.js';
import { appConfig } from '../config/appConfig.js';

export class BcryptPasswordService implements PasswordServicePort {
  private readonly saltRounds: number;

  constructor(saltRounds: number = appConfig.security.bcryptSaltRounds) {
    this.saltRounds = saltRounds;
  }

  async hash(password: PlainPassword): Promise<PasswordHash> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async matches(password: PlainPassword, hash: PasswordHash): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
