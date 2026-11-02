import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuditLog } from '../../domain/model/AuditLog.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userId: string;
  userType: string;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'nexusmarket-dev-secret';

export class LoginUseCase {
  private readonly userRepository: UserRepository;
  private readonly auditLogRepository: AuditLogRepository;

  constructor(userRepository: UserRepository, auditLogRepository: AuditLogRepository) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(params: LoginParams): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(params.email);
    if (user === null) {
      throw new InvalidCredentialsError();
    }
    const matches = await bcrypt.compare(params.password, user.password);
    if (!matches) {
      throw new InvalidCredentialsError();
    }
    const token = jwt.sign(
      { userId: user.userId, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

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

    return { token, userId: user.userId, userType: user.userType };
  }
}
