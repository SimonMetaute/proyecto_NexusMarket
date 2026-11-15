/**
 * Outbound Port: TransactionManagerPort.
 *
 * Declares the unit-of-work boundary the application needs without leaking
 * MySQL (or any other) details. The infrastructure adapter decides how the
 * transaction is opened and how repositories join the current context.
 */
export interface TransactionManagerPort {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
