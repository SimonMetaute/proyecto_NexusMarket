/**
 * Service Port: PaymentGatewayPort
 * Source: SDD/Domain/output-ports.md (Section 4.18)
 */

import type { Payment } from '../../entities/Payment.js';

export interface PaymentAuthorization {
  authorized: boolean;
  transactionId?: string;
}

export interface PaymentCapture {
  captured: boolean;
  transactionId?: string;
}

export interface RefundAmount {
  amount: number;
}

export interface RefundResult {
  refunded: boolean;
  transactionId?: string;
}

export interface PaymentGatewayPort {
  authorize(payment: Payment): Promise<PaymentAuthorization>;
  capture(payment: Payment): Promise<PaymentCapture>;
  refund(payment: Payment, amount: RefundAmount): Promise<RefundResult>;
}
