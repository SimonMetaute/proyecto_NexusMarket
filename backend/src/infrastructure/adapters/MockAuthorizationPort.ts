/**
 * Adapter: MockAuthorizationPort.
 *
 * Placeholder for role-based authorization checks beyond JWT role matching.
 */
import type { AuthorizationPort } from '../../domain/ports/out/AuthorizationPort.js';
import type { User } from '../../domain/model/user.js';

export class MockAuthorizationPort implements AuthorizationPort {
  async authorize(
    user: User,
    action: { action: string },
    resource: { entityId: string; entityType: string },
  ): Promise<{ authorized: boolean; reason?: string }> {
    return { authorized: true };
  }
}
