import { runInTransaction } from '../database/mysql-transaction.js';
import type { TransactionManagerPort } from '../../domain/ports/out/TransactionManagerPort.js';

/**
 * MySQL adapter for the unit-of-work port. The actual connection context lives
 * in `mysql-transaction.ts` so repositories can discover the active connection
 * without depending on this adapter.
 */
export class MySQLTransactionManager implements TransactionManagerPort {
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return runInTransaction(work);
  }
}
