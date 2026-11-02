import type { RowDataPacket } from 'mysql2/promise';
import type { PaymentRepositoryPort } from '../../domain/ports/out/PaymentRepositoryPort.js';
import { Payment } from '../../domain/entities/Payment.js';
import type { Order } from '../../domain/entities/Order.js';
import { PaymentStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNullableDate, toNumber } from './mappers/rowMappers.js';
import { currencyFromCode, paymentMethodFromJson, paymentMethodToJson } from './mappers/valueObjectMappers.js';

interface PaymentRow extends RowDataPacket {
  paymentId: string;
  orderId: string;
  paymentMethodJson: string;
  amount: number | string;
  currencyCode: string;
  paymentStatus: string;
  externalTransactionId: string | null;
  processingDate: Date | string | null;
}

function toDomain(row: PaymentRow): Payment {
  const params: {
    paymentId: string;
    orderId: string;
    paymentMethod: ReturnType<typeof paymentMethodFromJson>;
    amount: number;
    currency: ReturnType<typeof currencyFromCode>;
    paymentStatus: PaymentStatus;
    externalTransactionId?: string;
    processingDate?: Date;
  } = {
    paymentId: row.paymentId,
    orderId: row.orderId,
    paymentMethod: paymentMethodFromJson(row.paymentMethodJson),
    amount: toNumber(row.amount),
    currency: currencyFromCode(row.currencyCode),
    paymentStatus: row.paymentStatus as PaymentStatus,
  };

  if (row.externalTransactionId !== null) {
    params.externalTransactionId = row.externalTransactionId;
  }
  const processingDate = toNullableDate(row.processingDate);
  if (processingDate !== undefined) {
    params.processingDate = processingDate;
  }

  return new Payment(params);
}

export class MySQLPaymentRepository implements PaymentRepositoryPort {
  async save(payment: Payment): Promise<Payment> {
    await pool.execute(
      `INSERT INTO payments (
        paymentId, orderId, paymentMethodJson, amount, currencyCode,
        paymentStatus, externalTransactionId, processingDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        orderId = VALUES(orderId),
        paymentMethodJson = VALUES(paymentMethodJson),
        amount = VALUES(amount),
        currencyCode = VALUES(currencyCode),
        paymentStatus = VALUES(paymentStatus),
        externalTransactionId = VALUES(externalTransactionId),
        processingDate = VALUES(processingDate)`,
      [
        payment.paymentId,
        payment.orderId,
        paymentMethodToJson(payment.paymentMethod),
        payment.amount,
        payment.currency.code,
        payment.paymentStatus,
        payment.externalTransactionId ?? null,
        payment.processingDate ?? null,
      ],
    );
    return payment;
  }

  async findByIdentifier(payment: Payment): Promise<Payment | null> {
    const [rows] = await pool.query<PaymentRow[]>(
      'SELECT * FROM payments WHERE paymentId = ? LIMIT 1',
      [payment.paymentId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByOrder(order: Order): Promise<Payment | null> {
    const [rows] = await pool.query<PaymentRow[]>(
      'SELECT * FROM payments WHERE orderId = ? ORDER BY processingDate DESC LIMIT 1',
      [order.orderId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const [rows] = await pool.query<PaymentRow[]>(
      'SELECT * FROM payments WHERE paymentStatus = ?',
      [status],
    );
    return rows.map(toDomain);
  }
}
