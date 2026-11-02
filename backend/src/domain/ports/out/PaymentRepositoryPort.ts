/**
 * Outbound Port: PaymentRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.10)
 */

import type { Payment } from '../../entities/Payment.js';
import type { Order } from '../../entities/Order.js';
import { PaymentStatus } from '../../model/enums.js';

export interface PaymentRepositoryPort {
  save(payment: Payment): Promise<Payment>;
  findByIdentifier(payment: Payment): Promise<Payment | null>;
  findByOrder(order: Order): Promise<Payment | null>;
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
}
