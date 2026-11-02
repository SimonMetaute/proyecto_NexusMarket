/**
 * Adapter: MockPaymentGateway.
 *
 * Development-grade stub of `PaymentGatewayPort`.
 */
import type { PaymentGatewayPort } from '../../domain/ports/out/PaymentGatewayPort.js';
import type { Payment } from '../../domain/entities/Payment.js';

export class MockPaymentGateway implements PaymentGatewayPort {
  async authorize(payment: Payment): Promise<{ authorized: boolean; transactionId?: string }> {
    return { authorized: true, transactionId: `mock-${globalThis.crypto.randomUUID()}` };
  }

  async capture(payment: Payment): Promise<{ captured: boolean; transactionId?: string }> {
    return { captured: true, transactionId: `mock-${globalThis.crypto.randomUUID()}` };
  }

  async refund(payment: Payment, amount: { amount: number }): Promise<{ refunded: boolean; transactionId?: string }> {
    return { refunded: true, transactionId: `mock-refund-${globalThis.crypto.randomUUID()}` };
  }
}
