/**
 * Outbound Port: OperationRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.14)
 */

import type { Operation } from '../../entities/Operation.js';
import type { User } from '../../model/user.js';
import { OperationType } from '../../model/enums.js';

export interface OperationRepositoryPort {
  append(operation: Operation): Promise<Operation>;
  findByActor(user: User): Promise<Operation[]>;
  findByAffectedEntity(affectedEntity: string): Promise<Operation[]>;
  findByType(operationType: OperationType): Promise<Operation[]>;
}
