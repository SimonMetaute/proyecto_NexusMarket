/**
 * Domain Entity: Operation
 * Source: SDD/Domain/domain_model.md (Section 2.16)
 */

import { OperationType } from '../model/enums.js';
import type { User } from '../model/user.js';

export class Operation {
  private readonly _operationId: string;
  private readonly _operationType: OperationType;
  private readonly _executionDate: Date;
  private readonly _performedBy: User;
  private readonly _affectedEntity: string;
  private readonly _affectedEntityType: string;

  constructor(params: {
    operationId: string;
    operationType: OperationType;
    executionDate: Date;
    performedBy: User;
    affectedEntity: string;
    affectedEntityType: string;
  }) {
    if (!params.operationId || params.operationId.trim().length === 0) {
      throw new Error('Operation.operationId is required.');
    }
    if (!params.affectedEntity || params.affectedEntity.trim().length === 0) {
      throw new Error('Operation.affectedEntity is required.');
    }
    if (!params.affectedEntityType || params.affectedEntityType.trim().length === 0) {
      throw new Error('Operation.affectedEntityType is required.');
    }

    this._operationId = params.operationId.trim();
    this._operationType = params.operationType;
    this._executionDate = params.executionDate;
    this._performedBy = params.performedBy;
    this._affectedEntity = params.affectedEntity.trim();
    this._affectedEntityType = params.affectedEntityType.trim();
  }

  get operationId(): string {
    return this._operationId;
  }

  get operationType(): string {
    return this._operationType;
  }

  get executionDate(): Date {
    return this._executionDate;
  }

  get performedBy(): User {
    return this._performedBy;
  }

  get affectedEntity(): string {
    return this._affectedEntity;
  }

  get affectedEntityType(): string {
    return this._affectedEntityType;
  }
}
