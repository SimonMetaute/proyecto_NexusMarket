import type { RowDataPacket } from 'mysql2/promise';
import type { ReturnRepositoryPort } from '../../domain/ports/out/ReturnRepositoryPort.js';
import { Return } from '../../domain/entities/Return.js';
import type { Order } from '../../domain/entities/Order.js';
import { ReturnReason, ReturnStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNumber } from './mappers/rowMappers.js';

interface ReturnRow extends RowDataPacket {
  returnId: string;
  orderId: string;
  invoiceId: string;
  reason: string;
  returnStatus: string;
  requestDate: Date | string;
  refundAmount: number | string;
  evidence: string | null;
}

function toDomain(row: ReturnRow): Return {
  const params: {
    returnId: string;
    orderId: string;
    invoiceId: string;
    reason: ReturnReason;
    returnStatus: ReturnStatus;
    requestDate: Date;
    refundAmount: number;
    evidence?: string;
  } = {
    returnId: row.returnId,
    orderId: row.orderId,
    invoiceId: row.invoiceId,
    reason: row.reason as ReturnReason,
    returnStatus: row.returnStatus as ReturnStatus,
    requestDate: toDate(row.requestDate),
    refundAmount: toNumber(row.refundAmount),
  };

  if (row.evidence !== null) {
    params.evidence = row.evidence;
  }

  return new Return(params);
}

export class MySQLReturnRepository implements ReturnRepositoryPort {
  async save(returnCase: Return): Promise<Return> {
    await pool.execute(
      `INSERT INTO product_returns (
        returnId, orderId, invoiceId, reason, returnStatus, requestDate,
        refundAmount, evidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        orderId = VALUES(orderId),
        invoiceId = VALUES(invoiceId),
        reason = VALUES(reason),
        returnStatus = VALUES(returnStatus),
        requestDate = VALUES(requestDate),
        refundAmount = VALUES(refundAmount),
        evidence = VALUES(evidence)`,
      [
        returnCase.returnId,
        returnCase.orderId,
        returnCase.invoiceId,
        returnCase.reason,
        returnCase.returnStatus,
        returnCase.requestDate,
        returnCase.refundAmount,
        returnCase.evidence ?? null,
      ],
    );
    return returnCase;
  }

  async findByIdentifier(returnCase: Return): Promise<Return | null> {
    const [rows] = await pool.query<ReturnRow[]>(
      'SELECT * FROM product_returns WHERE returnId = ? LIMIT 1',
      [returnCase.returnId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByOrder(order: Order): Promise<Return[]> {
    const [rows] = await pool.query<ReturnRow[]>(
      'SELECT * FROM product_returns WHERE orderId = ?',
      [order.orderId],
    );
    return rows.map(toDomain);
  }

  async findByStatus(status: ReturnStatus): Promise<Return[]> {
    const [rows] = await pool.query<ReturnRow[]>(
      'SELECT * FROM product_returns WHERE returnStatus = ?',
      [status],
    );
    return rows.map(toDomain);
  }
}
