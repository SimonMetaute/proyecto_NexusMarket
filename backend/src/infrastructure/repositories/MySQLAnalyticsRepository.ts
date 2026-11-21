import type { RowDataPacket } from 'mysql2/promise';
import type {
  AdminDashboardStats,
  AnalyticsRepositoryPort,
  SellerDashboardStats,
  SellerSettlementStats,
  SettlementPeriod,
} from '../../domain/ports/out/AnalyticsRepositoryPort.js';
import { pool } from '../database/mysql-pool.js';
import { toNumber } from './mappers/rowMappers.js';

const ACTIVE_ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Sent'] as const;
const PENDING_RETURN_STATUSES = ['Requested', 'InReview', 'Approved'] as const;

interface AggregateRow extends RowDataPacket {
  value: number | string | null;
}

function placeholders(values: readonly string[]): string {
  return values.map(() => '?').join(', ');
}

async function scalar(sql: string, params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<AggregateRow[]>(sql, params);
  const row = rows[0];
  return row === undefined || row.value === null ? 0 : toNumber(row.value);
}

/**
 * Read-only projections for the dashboards. Every number is computed from the
 * transactional tables; nothing is hard-coded.
 */
export class MySQLAnalyticsRepository implements AnalyticsRepositoryPort {
  async getAdminDashboard(): Promise<AdminDashboardStats> {
    const activeStatuses = placeholders(ACTIVE_ORDER_STATUSES);
    const pendingReturns = placeholders(PENDING_RETURN_STATUSES);

    const [
      activeOrders,
      totalSales,
      totalOrders,
      totalUsers,
      totalSellers,
      totalProducts,
      publishedProducts,
      pendingReturnsCount,
    ] = await Promise.all([
      scalar(`SELECT COUNT(*) AS value FROM orders WHERE orderStatus IN (${activeStatuses})`, [
        ...ACTIVE_ORDER_STATUSES,
      ]),
      scalar(
        `SELECT COALESCE(SUM(total), 0) AS value FROM orders
         WHERE orderStatus NOT IN ('Cancelled', 'Refunded')`,
      ),
      scalar('SELECT COUNT(*) AS value FROM orders'),
      scalar('SELECT COUNT(*) AS value FROM users'),
      scalar('SELECT COUNT(*) AS value FROM sellers'),
      scalar('SELECT COUNT(*) AS value FROM products'),
      scalar("SELECT COUNT(*) AS value FROM products WHERE productStatus = 'Published'"),
      scalar(
        `SELECT COUNT(*) AS value FROM product_returns WHERE returnStatus IN (${pendingReturns})`,
        [...PENDING_RETURN_STATUSES],
      ),
    ]);

    return {
      activeOrders,
      totalSales,
      totalOrders,
      totalUsers,
      totalSellers,
      totalProducts,
      publishedProducts,
      pendingReturns: pendingReturnsCount,
    };
  }

  async getSellerDashboard(sellerId: string): Promise<SellerDashboardStats> {
    const activeStatuses = placeholders(ACTIVE_ORDER_STATUSES);
    const pendingReturns = placeholders(PENDING_RETURN_STATUSES);

    const [
      activeOrders,
      totalSales,
      totalOrders,
      totalProducts,
      publishedProducts,
      totalStock,
      pendingReturnsCount,
    ] = await Promise.all([
      scalar(
        `SELECT COUNT(*) AS value FROM orders
         WHERE sellerId = ? AND orderStatus IN (${activeStatuses})`,
        [sellerId, ...ACTIVE_ORDER_STATUSES],
      ),
      scalar(
        `SELECT COALESCE(SUM(total), 0) AS value FROM orders
         WHERE sellerId = ? AND orderStatus NOT IN ('Cancelled', 'Refunded')`,
        [sellerId],
      ),
      scalar('SELECT COUNT(*) AS value FROM orders WHERE sellerId = ?', [sellerId]),
      scalar('SELECT COUNT(*) AS value FROM products WHERE sellerId = ?', [sellerId]),
      scalar(
        "SELECT COUNT(*) AS value FROM products WHERE sellerId = ? AND productStatus = 'Published'",
        [sellerId],
      ),
      scalar(`SELECT COALESCE(SUM(i.availableStock), 0) AS value FROM inventory i INNER JOIN products p ON p.productId = i.productId WHERE p.sellerId = ?`, [
        sellerId,
      ]),
      scalar(
        `SELECT COUNT(*) AS value
         FROM product_returns r
         INNER JOIN orders o ON o.orderId = r.orderId
         WHERE o.sellerId = ? AND r.returnStatus IN (${pendingReturns})`,
        [sellerId, ...PENDING_RETURN_STATUSES],
      ),
    ]);

    return {
      activeOrders,
      totalSales,
      totalOrders,
      totalProducts,
      publishedProducts,
      totalStock,
      pendingReturns: pendingReturnsCount,
    };
  }

  /**
   * Settlement aggregates for one period. Sales are grouped by order date and
   * refunds by return request date, so a period report is reproducible.
   */
  async getSellerSettlement(
    sellerId: string,
    period: SettlementPeriod,
  ): Promise<SellerSettlementStats> {
    const pendingReturns = placeholders(PENDING_RETURN_STATUSES);
    const range = [sellerId, period.startDate, period.endDate];

    const [
      orderCount,
      deliveredOrders,
      grossSales,
      deliveredSales,
      refundedAmount,
      pendingReturnsCount,
    ] = await Promise.all([
      scalar(
        `SELECT COUNT(*) AS value FROM orders
         WHERE sellerId = ? AND creationDate BETWEEN ? AND ?`,
        range,
      ),
      scalar(
        `SELECT COUNT(*) AS value FROM orders
         WHERE sellerId = ? AND orderStatus = 'Delivered'
           AND creationDate BETWEEN ? AND ?`,
        range,
      ),
      scalar(
        `SELECT COALESCE(SUM(total), 0) AS value FROM orders
         WHERE sellerId = ? AND orderStatus NOT IN ('Cancelled', 'Refunded')
           AND creationDate BETWEEN ? AND ?`,
        range,
      ),
      scalar(
        `SELECT COALESCE(SUM(total), 0) AS value FROM orders
         WHERE sellerId = ? AND orderStatus = 'Delivered'
           AND creationDate BETWEEN ? AND ?`,
        range,
      ),
      scalar(
        `SELECT COALESCE(SUM(r.refundAmount), 0) AS value
         FROM product_returns r
         INNER JOIN orders o ON o.orderId = r.orderId
         WHERE o.sellerId = ? AND r.returnStatus IN ('Approved', 'Completed')
           AND r.requestDate BETWEEN ? AND ?`,
        range,
      ),
      scalar(
        `SELECT COUNT(*) AS value
         FROM product_returns r
         INNER JOIN orders o ON o.orderId = r.orderId
         WHERE o.sellerId = ? AND r.returnStatus IN (${pendingReturns})`,
        [sellerId, ...PENDING_RETURN_STATUSES],
      ),
    ]);

    return {
      orderCount,
      deliveredOrders,
      grossSales,
      deliveredSales,
      refundedAmount,
      pendingReturns: pendingReturnsCount,
    };
  }
}
