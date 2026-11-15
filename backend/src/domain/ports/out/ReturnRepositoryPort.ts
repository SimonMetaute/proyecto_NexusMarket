/**
 * Outbound Port: ReturnRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.12)
 */

import type { Return } from '../../entities/Return.js';
import type { Order } from '../../entities/Order.js';
import { ReturnStatus } from '../../model/enums.js';

export interface ReturnQueryFilters {
  status?: ReturnStatus;
  orderId?: string;
  invoiceId?: string;
}

export interface ReturnRepositoryPort {
  save(returnCase: Return): Promise<Return>;
  findByIdentifier(returnCase: Return): Promise<Return | null>;
  findByOrder(order: Order): Promise<Return[]>;
  findByStatus(status: ReturnStatus): Promise<Return[]>;
  /** Logistics inbox: every return, optionally filtered. */
  findAll(filters?: ReturnQueryFilters): Promise<Return[]>;
}
