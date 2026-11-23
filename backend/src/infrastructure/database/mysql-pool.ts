import mysql from 'mysql2/promise';
import { appConfig } from '../config/appConfig.js';

/**
 * Shared MySQL pool. Connection settings come from `appConfig` so nothing in
 * infrastructure reads `process.env` directly.
 */
export const pool = mysql.createPool({
  host: appConfig.mysql.host,
  port: appConfig.mysql.port,
  user: appConfig.mysql.user,
  password: appConfig.mysql.password,
  database: appConfig.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(appConfig.mysql.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
});
