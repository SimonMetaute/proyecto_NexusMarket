/**
 * Outbound Port: AuditLogRepository.
 *
 * DDD purity rules applied:
 *  - Abstraction owned by the domain. Declares WHAT audit persistence
 *    the domain needs, never HOW it is implemented.
 *  - No imports of databases, drivers, or infrastructure elements.
 *  - Only TypeScript built-ins and the domain entity `AuditLog` are used.
 */
import type { AuditLog } from '../../model/AuditLog.js';

export interface AuditLogQueryFilters {
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Append-only persistence contract for `AuditLog` records.
 * Implemented in infrastructure (MongoDB adapter).
 */
export interface AuditLogRepository {
  /**
   * Persists an audit record (insert only, never update).
   */
  save(log: AuditLog): Promise<void>;

  /**
   * Reads audit records with optional filters and pagination.
   */
  query(filters: AuditLogQueryFilters, page: number, limit: number): Promise<AuditLogPage>;
}
