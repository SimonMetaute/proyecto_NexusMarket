import type { RowDataPacket } from 'mysql2/promise';
import type { OperationRepositoryPort } from '../../domain/ports/out/OperationRepositoryPort.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import { Operation } from '../../domain/entities/Operation.js';
import type { User } from '../../domain/model/user.js';
import { OperationType } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate } from './mappers/rowMappers.js';

interface OperationRow extends RowDataPacket {
  operationId: string;
  operationType: string;
  executionDate: Date | string;
  performedByUserId: string;
  affectedEntity: string;
  affectedEntityType: string;
}

export class MySQLOperationRepository implements OperationRepositoryPort {
  /**
   * Operations embed the acting `User` in the domain model. The adapter
   * resolves it through the user port instead of duplicating identity columns.
   */
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  private async toDomain(row: OperationRow): Promise<Operation> {
    const actor = await this.userRepository.findById(row.performedByUserId);
    if (actor === null) {
      throw new Error(
        `Operation "${row.operationId}" references unknown user "${row.performedByUserId}".`,
      );
    }

    return new Operation({
      operationId: row.operationId,
      operationType: row.operationType as OperationType,
      executionDate: toDate(row.executionDate),
      performedBy: actor,
      affectedEntity: row.affectedEntity,
      affectedEntityType: row.affectedEntityType,
    });
  }

  async append(operation: Operation): Promise<Operation> {
    await pool.execute(
      `INSERT INTO operations (
        operationId, operationType, executionDate, performedByUserId,
        affectedEntity, affectedEntityType
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        operation.operationId,
        operation.operationType,
        operation.executionDate,
        operation.performedBy.userId,
        operation.affectedEntity,
        operation.affectedEntityType,
      ],
    );
    return operation;
  }

  async findByActor(user: User): Promise<Operation[]> {
    const [rows] = await pool.query<OperationRow[]>(
      'SELECT * FROM operations WHERE performedByUserId = ? ORDER BY executionDate DESC',
      [user.userId],
    );
    return Promise.all(rows.map((row) => this.toDomain(row)));
  }

  async findByAffectedEntity(affectedEntity: string): Promise<Operation[]> {
    const [rows] = await pool.query<OperationRow[]>(
      'SELECT * FROM operations WHERE affectedEntity = ? ORDER BY executionDate DESC',
      [affectedEntity],
    );
    return Promise.all(rows.map((row) => this.toDomain(row)));
  }

  async findByType(operationType: OperationType): Promise<Operation[]> {
    const [rows] = await pool.query<OperationRow[]>(
      'SELECT * FROM operations WHERE operationType = ? ORDER BY executionDate DESC',
      [operationType],
    );
    return Promise.all(rows.map((row) => this.toDomain(row)));
  }
}
