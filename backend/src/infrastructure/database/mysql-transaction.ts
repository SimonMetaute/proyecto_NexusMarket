import { AsyncLocalStorage } from 'node:async_hooks';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from './mysql-pool.js';

/**
 * Request-scoped MySQL connection context.
 *
 * Repositories must not open their own connections/transactions when they are
 * participating in a use case that requires atomicity. Instead they ask for the
 * current executor: inside `runInTransaction` it is the dedicated connection,
 * outside it falls back to the shared pool.
 *
 * `AsyncLocalStorage` keeps the port interfaces free of infrastructure details
 * (the domain never sees a connection) while allowing the application service
 * to orchestrate several aggregates atomically.
 */
const transactionContext = new AsyncLocalStorage<PoolConnection>();

export type DbExecutor = Pick<PoolConnection, 'execute' | 'query'>;

export function getExecutor(): DbExecutor {
  return transactionContext.getStore() ?? pool;
}

/**
 * Runs `work` inside a single MySQL transaction. Any thrown error rolls every
 * statement back, so a failure creating the warehouse also removes the user and
 * the seller profile created earlier in the same unit of work.
 */
export async function runInTransaction<T>(work: () => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await transactionContext.run(connection, work);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('[transaction] rollback failed', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}
