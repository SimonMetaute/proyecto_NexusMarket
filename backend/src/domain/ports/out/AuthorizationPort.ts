/**
 * Service Port: AuthorizationPort
 * Source: SDD/Domain/output-ports.md (Section 4.20)
 */

import type { User } from '../../model/user.js';

export interface DomainAction {
  action: string;
}

export interface EntityReference {
  entityId: string;
  entityType: string;
}

export interface AuthorizationDecision {
  authorized: boolean;
  reason?: string;
}

export interface AuthorizationPort {
  authorize(user: User, action: DomainAction, resource: EntityReference): Promise<AuthorizationDecision>;
}
