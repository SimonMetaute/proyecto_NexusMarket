import type { AuditLog } from '../../../domain/model/AuditLog.js';

export function toAuditLogResponse(log: AuditLog): Record<string, unknown> {
  return {
    id: log.id,
    actorId: log.actorId,
    action: log.action,
    timestamp: log.timestamp,
    details: log.details,
  };
}
