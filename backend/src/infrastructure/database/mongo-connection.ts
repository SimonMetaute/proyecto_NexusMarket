import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';
import { appConfig } from '../config/appConfig.js';

const MONGO_URI = appConfig.mongo.uri;

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Initializes the MongoDB connection for audit persistence.
 * Idempotent: reuses the existing connection when already connected.
 */
export async function initMongo(): Promise<Db> {
  if (db !== null) {
    return db;
  }
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db();
  return db;
}

/**
 * Returns the initialized audit database.
 * Throws when initMongo() has not been called yet.
 */
export function getAuditDb(): Db {
  if (db === null) {
    throw new Error('MongoDB not initialized. Call initMongo() first.');
  }
  return db;
}
