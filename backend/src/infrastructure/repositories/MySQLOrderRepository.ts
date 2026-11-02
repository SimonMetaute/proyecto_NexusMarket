import type { RowDataPacket } from 'mysql2/promise';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import { Order, OrderLine } from '../../domain/entities/Order.js';
import type { Buyer } from '../../domain/entities/Buyer.js';
import type { Seller } from '../../domain/entities/Seller.js';
import { OrderStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNullableDate, toNumber } from './mappers/rowMappers.js';

interface OrderRow extends RowDataPacket {
  orderId: string;
  buyerId: string;
  sellerId: string;
  subtotal: number | string;
  taxes: number | string;
  shippingCost: number | string;
  total: number | string;
  orderStatus: string;
  creationDate: Date | string;
  estimatedDeliveryDate: Date | string | null;
}

interface OrderLineRow extends RowDataPacket {
  orderLineId: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number | string;
  unitPrice: number | string;
  subtotal: number | string;
}

function lineToDomain(row: OrderLineRow): OrderLine {
  const params: {
    orderLineId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    variantId?: string;
  } = {
    orderLineId: row.orderLineId,
    productId: row.productId,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unitPrice),
    subtotal: toNumber(row.subtotal),
  };
  if (row.variantId !== null) {
    params.variantId = row.variantId;
  }
  return new OrderLine(params);
}

function orderToDomain(row: OrderRow, lines: OrderLineRow[]): Order {
  const params: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    orderLines: OrderLine[];
    subtotal: number;
    taxes: number;
    shippingCost: number;
    total: number;
    orderStatus: OrderStatus;
    creationDate: Date;
    estimatedDeliveryDate?: Date;
  } = {
    orderId: row.orderId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    orderLines: lines.map(lineToDomain),
    subtotal: toNumber(row.subtotal),
    taxes: toNumber(row.taxes),
    shippingCost: toNumber(row.shippingCost),
    total: toNumber(row.total),
    orderStatus: row.orderStatus as OrderStatus,
    creationDate: toDate(row.creationDate),
  };

  const estimatedDeliveryDate = toNullableDate(row.estimatedDeliveryDate);
  if (estimatedDeliveryDate !== undefined) {
    params.estimatedDeliveryDate = estimatedDeliveryDate;
  }

  return new Order(params);
}

export class MySQLOrderRepository implements OrderRepositoryPort {
  private async loadLines(orderId: string): Promise<OrderLineRow[]> {
    const [rows] = await pool.query<OrderLineRow[]>(
      'SELECT * FROM order_lines WHERE orderId = ?',
      [orderId],
    );
    return rows;
  }

  private async loadOrder(row: OrderRow): Promise<Order> {
    const lines = await this.loadLines(row.orderId);
    return orderToDomain(row, lines);
  }

  async save(order: Order): Promise<Order> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO orders (
          orderId, buyerId, sellerId, subtotal, taxes, shippingCost, total,
          orderStatus, creationDate, estimatedDeliveryDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          buyerId = VALUES(buyerId),
          sellerId = VALUES(sellerId),
          subtotal = VALUES(subtotal),
          taxes = VALUES(taxes),
          shippingCost = VALUES(shippingCost),
          total = VALUES(total),
          orderStatus = VALUES(orderStatus),
          estimatedDeliveryDate = VALUES(estimatedDeliveryDate)`,
        [
          order.orderId,
          order.buyerId,
          order.sellerId,
          order.subtotal,
          order.taxes,
          order.shippingCost,
          order.total,
          order.orderStatus,
          order.creationDate,
          order.estimatedDeliveryDate ?? null,
        ],
      );

      await connection.execute('DELETE FROM order_lines WHERE orderId = ?', [order.orderId]);

      for (const line of order.orderLines) {
        await connection.execute(
          `INSERT INTO order_lines (
            orderLineId, orderId, productId, variantId, quantity, unitPrice, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            line.orderLineId,
            order.orderId,
            line.productId,
            line.variantId ?? null,
            line.quantity,
            line.unitPrice,
            line.subtotal,
          ],
        );
      }

      await connection.commit();
      return order;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findByIdentifier(order: Order): Promise<Order | null> {
    const [rows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE orderId = ? LIMIT 1',
      [order.orderId],
    );
    const row = rows[0];
    return row === undefined ? null : this.loadOrder(row);
  }

  async findByBuyer(buyer: Buyer): Promise<Order[]> {
    const [rows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE buyerId = ? ORDER BY creationDate DESC',
      [buyer.buyerId],
    );
    return Promise.all(rows.map((row) => this.loadOrder(row)));
  }

  async findBySeller(seller: Seller): Promise<Order[]> {
    const [rows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE sellerId = ? ORDER BY creationDate DESC',
      [seller.sellerId],
    );
    return Promise.all(rows.map((row) => this.loadOrder(row)));
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const [rows] = await pool.query<OrderRow[]>(
      'SELECT * FROM orders WHERE orderStatus = ? ORDER BY creationDate DESC',
      [status],
    );
    return Promise.all(rows.map((row) => this.loadOrder(row)));
  }
}
