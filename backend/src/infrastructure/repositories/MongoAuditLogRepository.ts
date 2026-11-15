import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import type { AuditLog } from '../../domain/model/AuditLog.js';
import { getAuditDb, initMongo, isMongoInitialized } from '../database/mongo-connection.js';

/**
 * MongoDB adapter for audit persistence (append-only).
 * Collection: `audit_logs`. Inserts domain objects directly.
 *
 * Audit is a cross-cutting concern: a MongoDB outage must NOT take down the
 * business flow or turn a successful operation into a 500. Failures are logged
 * and the call resolves; a production deployment should additionally publish
 * to a durable outbox/queue so no audit entry is lost.
 */
export class MongoAuditLogRepository implements AuditLogRepository {
  async save(log: AuditLog): Promise<void> {
    try {
      await this.insert(log);
    } catch (error) {
      // Lazy reconnection: the server may have started before MongoDB was up.
      if (!isMongoInitialized()) {
        try {
          await initMongo();
          await this.insert(log);
          return;
        } catch (retryError) {
          console.warn(
            `[audit] Could not persist audit log "${log.action}" (${log.id}):`,
            retryError instanceof Error ? retryError.message : retryError,
          );
          return;
        }
      }
      console.warn(
        `[audit] Could not persist audit log "${log.action}" (${log.id}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async insert(log: AuditLog): Promise<void> {
    const db = getAuditDb();
    await db
      .collection<{
        _id: string;
        actorId: string;
        action: string;
        timestamp: Date;
        details: Record<string, unknown>;
      }>('audit_logs')
      .insertOne({
        _id: log.id,
        actorId: log.actorId,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
      });
  }
}
