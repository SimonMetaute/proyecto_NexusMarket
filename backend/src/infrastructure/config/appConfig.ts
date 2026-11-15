/**
 * Application configuration - NexusMarket backend.
 *
 * All environment-dependent values are resolved here so that infrastructure
 * adapters (database, security, HTTP) do not read `process.env` directly.
 * Defaults are development-safe; secrets MUST be supplied through the
 * environment in any non-development deployment.
 */

function envString(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim().length > 0 ? value.trim() : fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const appConfig = {
  server: {
    port: envNumber('PORT', 3000),
    nodeEnv: envString('NODE_ENV', 'development'),
  },
  mysql: {
    host: envString('MYSQL_HOST', 'localhost'),
    port: envNumber('MYSQL_PORT', 3306),
    user: envString('MYSQL_USER', 'nexus_user'),
    password: envString('MYSQL_PASSWORD', 'nexus_pass'),
    database: envString('MYSQL_DATABASE', 'nexusmarket'),
  },
  mongo: {
    uri: envString('MONGO_URI', 'mongodb://localhost:27017/audit_db'),
    serverSelectionTimeoutMs: envNumber('MONGO_TIMEOUT_MS', 1500),
  },
  security: {
    jwtSecret: envString('JWT_SECRET', 'nexusmarket-dev-secret'),
    jwtExpiresInSeconds: envNumber('JWT_EXPIRES_IN_SECONDS', 3600),
    bcryptSaltRounds: envNumber('BCRYPT_SALT_ROUNDS', 10),
  },
  cors: {
    allowedOrigins: envString('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  },
} as const;

export function isProduction(): boolean {
  return appConfig.server.nodeEnv === 'production';
}
