import { AuditLog } from '../../domain/model/AuditLog.js';
import { deriveUsername, resolveUserRole } from '../../domain/model/user.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import type { JwtServicePort } from '../../domain/ports/out/JwtServicePort.js';
import type { PasswordServicePort } from '../../domain/ports/out/PasswordServicePort.js';

export interface LoginParams {
  email: string;
  password: string;
}

/**
 * Login result shaped after `SDD/Adapters/Api-rest-endpoints.md` §3.1:
 * `{ token, user: { userId, email, role, username }, expiresIn }`.
 */
export interface LoginResult {
  token: string;
  user: {
    userId: string;
    email: string;
    role: string;
    username: string;
  };
  expiresIn: number;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export class LoginUseCase {
  private readonly userRepository: UserRepository;
  private readonly auditLogRepository: AuditLogRepository;
  private readonly passwordService: PasswordServicePort;
  private readonly jwtService: JwtServicePort;
  private readonly expiresInSeconds: number;

  /**
   * Security capabilities are injected through their ports; this use case no
   * longer depends on bcrypt or jsonwebtoken directly.
   */
  constructor(
    userRepository: UserRepository,
    auditLogRepository: AuditLogRepository,
    passwordService: PasswordServicePort,
    jwtService: JwtServicePort,
    expiresInSeconds = 3600,
  ) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
    this.passwordService = passwordService;
    this.jwtService = jwtService;
    this.expiresInSeconds = expiresInSeconds;
  }

  async execute(params: LoginParams): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(params.email);
    if (user === null) {
      throw new InvalidCredentialsError();
    }

    const matches = await this.passwordService.matches(params.password, user.password);
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    const token = await this.jwtService.generate(user);

    // Register audit event for successful login.
    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'USER_LOGIN',
        timestamp: new Date(),
        details: { email: user.email },
      }),
    );

    return {
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: resolveUserRole(user.userType),
        username: deriveUsername(user.email),
      },
      expiresIn: this.expiresInSeconds,
    };
  }
}
