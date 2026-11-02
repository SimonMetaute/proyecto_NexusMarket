import type { RowDataPacket } from 'mysql2/promise';
import type { InvoiceRepositoryPort } from '../../domain/ports/out/InvoiceRepositoryPort.js';
import { Invoice } from '../../domain/entities/Invoice.js';
import type { Order } from '../../domain/entities/Order.js';
import { InvoiceStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNumber } from './mappers/rowMappers.js';
import { currencyFromCode } from './mappers/valueObjectMappers.js';

interface InvoiceRow extends RowDataPacket {
  invoiceId: string;
  orderId: string;
  invoiceNumber: string;
  issueDate: Date | string;
  subtotal: number | string;
  taxes: number | string;
  total: number | string;
  currencyCode: string;
  invoiceStatus: string;
}

function toDomain(row: InvoiceRow): Invoice {
  return new Invoice({
    invoiceId: row.invoiceId,
    orderId: row.orderId,
    invoiceNumber: row.invoiceNumber,
    issueDate: toDate(row.issueDate),
    subtotal: toNumber(row.subtotal),
    taxes: toNumber(row.taxes),
    total: toNumber(row.total),
    currency: currencyFromCode(row.currencyCode),
    invoiceStatus: row.invoiceStatus as InvoiceStatus,
  });
}

export class MySQLInvoiceRepository implements InvoiceRepositoryPort {
  async save(invoice: Invoice): Promise<Invoice> {
    await pool.execute(
      `INSERT INTO invoices (
        invoiceId, orderId, invoiceNumber, issueDate, subtotal, taxes, total,
        currencyCode, invoiceStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        orderId = VALUES(orderId),
        invoiceNumber = VALUES(invoiceNumber),
        issueDate = VALUES(issueDate),
        subtotal = VALUES(subtotal),
        taxes = VALUES(taxes),
        total = VALUES(total),
        currencyCode = VALUES(currencyCode),
        invoiceStatus = VALUES(invoiceStatus)`,
      [
        invoice.invoiceId,
        invoice.orderId,
        invoice.invoiceNumber,
        invoice.issueDate,
        invoice.subtotal,
        invoice.taxes,
        invoice.total,
        invoice.currency.code,
        invoice.invoiceStatus,
      ],
    );
    return invoice;
  }

  async findByIdentifier(invoice: Invoice): Promise<Invoice | null> {
    const [rows] = await pool.query<InvoiceRow[]>(
      'SELECT * FROM invoices WHERE invoiceId = ? LIMIT 1',
      [invoice.invoiceId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByOrder(order: Order): Promise<Invoice | null> {
    const [rows] = await pool.query<InvoiceRow[]>(
      'SELECT * FROM invoices WHERE orderId = ? LIMIT 1',
      [order.orderId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const [rows] = await pool.query<InvoiceRow[]>(
      'SELECT * FROM invoices WHERE invoiceNumber = ? LIMIT 1',
      [invoiceNumber],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }
}
