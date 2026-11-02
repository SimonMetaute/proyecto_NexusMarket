/**
 * Outbound Port: InvoiceRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.9)
 */

import type { Invoice } from '../../entities/Invoice.js';
import type { Order } from '../../entities/Order.js';

export interface InvoiceRepositoryPort {
  save(invoice: Invoice): Promise<Invoice>;
  findByIdentifier(invoice: Invoice): Promise<Invoice | null>;
  findByOrder(order: Order): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
}
