import type { AuditLogRepository, AuditLogPage, AuditLogQueryFilters } from '../../domain/ports/out/AuditLogRepository.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import { getAuditDb, initMongo, isMongoInitialized } from '../database/mongo-connection.js';

interface AuditLogDocument {
  _id: string;
  actorId: string;
  action: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

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
      .collection<AuditLogDocument>('audit_logs')
      .insertOne({
        _id: log.id,
        actorId: log.actorId,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
      });
  }

  async query(
    filters: AuditLogQueryFilters,
    page: number,
    limit: number,
  ): Promise<AuditLogPage> {
    if (!isMongoInitialized()) {
      await initMongo();
    }
    const query: Record<string, unknown> = {};
    if (filters.actorId !== undefined) {
      query.actorId = filters.actorId;
    }
    if (filters.action !== undefined) {
      query.action = filters.action;
    }
    if (filters.from !== undefined || filters.to !== undefined) {
      const range: Record<string, Date> = {};
      if (filters.from !== undefined) {
        range.$gte = filters.from;
      }
      if (filters.to !== undefined) {
        range.$lte = filters.to;
      }
      query.timestamp = range;
    }

    const collection = getAuditDb().collection<AuditLogDocument>('audit_logs');
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 20;
    const [total, documents] = await Promise.all([
      collection.countDocuments(query),
      collection
        .find(query)
        .sort({ timestamp: -1, _id: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .toArray(),
    ]);

    const items = documents.map(
      (document) =>
        new AuditLog({
          id: document._id,
          actorId: document.actorId,
          action: document.action,
          timestamp: document.timestamp,
          details: document.details,
        }),
    );
    return { items, total, page: safePage, limit: safeLimit };
  }
}
