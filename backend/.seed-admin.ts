/**
 * Seed script: creates the first ADMINISTRATOR user.
 *
 * Usage:
 *   BACKEND_ADMIN_EMAIL=admin@example.com BACKEND_ADMIN_PASSWORD=secret1234 \
 *   node_modules/.bin/tsx .seed-admin.ts
 *
 * Idempotent: safe to run multiple times.
 */
import { initDb } from './src/infrastructure/database/init-db.js';
import { initMongo } from './src/infrastructure/database/mongo-connection.js';
import { MySQLUserRepository } from './src/infrastructure/repositories/MySQLUserRepository.js';
import { MongoAuditLogRepository } from './src/infrastructure/repositories/MongoAuditLogRepository.js';
import { BcryptPasswordService } from './infrastructure/security/BcryptPasswordService.js';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase.js';
import { UserType } from './src/domain/model/user.js';
import { IdentityDocument } from './src/domain/model/user.js';
import { AuditLog } from './src/domain/model/AuditLog.js';

const email = process.env.BACKEND_ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.BACKEND_ADMIN_PASSWORD ?? 'admin1234';
const firstName = process.env.BACKEND_ADMIN_FIRST_NAME ?? 'Admin';
const lastName = process.env.BACKEND_ADMIN_LAST_NAME ?? 'Nexus';

try {
  await initDb();
  await initMongo();

  const userRepository = new MySQLUserRepository();
  const auditLogRepository = new MongoAuditLogRepository();
  const passwordService = new BcryptPasswordService();

  const existing = await userRepository.findByEmail(email);
  if (existing !== null) {
    console.log(`Admin user already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await passwordService.hash(password);
  const userId = globalThis.crypto.randomUUID();
  const user = new (await import('./src/domain/model/user.js')).User({
    userId,
    userType: UserType.Administrator,
    firstName,
    lastName,
    email,
    password: passwordHash,
    phone: '',
    identityDocument: new IdentityDocument('Citizenship Card', `ADMIN-${userId}`),
    registrationDate: new Date(),
    status: 'Active',
    updateDate: new Date(),
  });

  await userRepository.save(user);

  await auditLogRepository.save(
    new AuditLog({
      id: globalThis.crypto.randomUUID(),
      actorId: userId,
      action: 'USER_REGISTERED',
      timestamp: new Date(),
      details: { email, role: UserType.Administrator, seeded: true },
    }),
  );

  console.log(`Admin user created: ${email} (id: ${userId})`);
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
