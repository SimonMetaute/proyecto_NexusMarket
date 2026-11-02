import { randomUUID } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { InventoryRepositoryPort } from '../../domain/ports/out/InventoryRepositoryPort.js';
import { Inventory } from '../../domain/entities/Inventory.js';
import type { Product } from '../../domain/entities/Product.js';
import type { Warehouse } from '../../domain/entities/Warehouse.js';
import type { Order } from '../../domain/entities/Order.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNumber, toQuantityValue } from './mappers/rowMappers.js';

interface InventoryRow extends RowDataPacket {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  availableStock: number | string;
  reservedStock: number | string;
  totalStock: number | string;
  updateDate: Date | string;
}

interface AvailableStockRow extends RowDataPacket {
  total: number | string | null;
}

function toDomain(row: InventoryRow): Inventory {
  return new Inventory({
    inventoryId: row.inventoryId,
    productId: row.productId,
    warehouseId: row.warehouseId,
    availableStock: toNumber(row.availableStock),
    reservedStock: toNumber(row.reservedStock),
    totalStock: toNumber(row.totalStock),
    updateDate: toDate(row.updateDate),
  });
}

export class MySQLInventoryRepository implements InventoryRepositoryPort {
  async save(inventory: Inventory): Promise<Inventory> {
    await pool.execute(
      `INSERT INTO inventory (
        inventoryId, productId, warehouseId, availableStock, reservedStock,
        totalStock, updateDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        availableStock = VALUES(availableStock),
        reservedStock = VALUES(reservedStock),
        totalStock = VALUES(totalStock),
        updateDate = VALUES(updateDate)`,
      [
        inventory.inventoryId,
        inventory.productId,
        inventory.warehouseId,
        inventory.availableStock,
        inventory.reservedStock,
        inventory.totalStock,
        inventory.updateDate,
      ],
    );
    return inventory;
  }

  async findByProductAndWarehouse(product: Product, warehouse: Warehouse): Promise<Inventory | null> {
    const [rows] = await pool.query<InventoryRow[]>(
      'SELECT * FROM inventory WHERE productId = ? AND warehouseId = ? LIMIT 1',
      [product.productId, warehouse.warehouseId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByProduct(product: Product): Promise<Inventory[]> {
    const [rows] = await pool.query<InventoryRow[]>(
      'SELECT * FROM inventory WHERE productId = ?',
      [product.productId],
    );
    return rows.map(toDomain);
  }

  async hasAvailableStock(product: Product, quantity: any): Promise<boolean> {
    const requested = toQuantityValue(quantity);
    const [rows] = await pool.query<AvailableStockRow[]>(
      'SELECT COALESCE(SUM(availableStock), 0) AS total FROM inventory WHERE productId = ?',
      [product.productId],
    );
    const row = rows[0];
    const available = row === undefined || row.total === null ? 0 : toNumber(row.total);
    return available >= requested;
  }

  async reserve(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory> {
    const requested = toQuantityValue(quantity);
    return this.withInventoryLock(product, warehouse, async (connection, inventory) => {
      inventory.reserve(requested);
      await this.persist(connection, inventory);
      await this.applyReservationDelta(connection, inventory.inventoryId, order.orderId, requested);
      return inventory;
    });
  }

  async release(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory> {
    const requested = toQuantityValue(quantity);
    return this.withInventoryLock(product, warehouse, async (connection, inventory) => {
      inventory.release(requested);
      await this.persist(connection, inventory);
      await this.applyReservationDelta(connection, inventory.inventoryId, order.orderId, -requested);
      return inventory;
    });
  }

  async deduct(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory> {
    const requested = toQuantityValue(quantity);
    return this.withInventoryLock(product, warehouse, async (connection, inventory) => {
      inventory.deduct(requested);
      await this.persist(connection, inventory);
      await this.applyReservationDelta(connection, inventory.inventoryId, order.orderId, -requested);
      return inventory;
    });
  }

  /**
   * Locks the inventory row (`SELECT ... FOR UPDATE`), runs the mutation and
   * commits atomically. The reservation ledger makes release/deduct traceable
   * per order without adding an order reference to the domain aggregate.
   */
  private async withInventoryLock<T>(
    product: Product,
    warehouse: Warehouse,
    operation: (connection: PoolConnection, inventory: Inventory) => Promise<T>,
  ): Promise<T> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query<InventoryRow[]>(
        'SELECT * FROM inventory WHERE productId = ? AND warehouseId = ? FOR UPDATE',
        [product.productId, warehouse.warehouseId],
      );
      const row = rows[0];
      if (row === undefined) {
        throw new Error(
          `Inventory not found for product "${product.productId}" in warehouse "${warehouse.warehouseId}".`,
        );
      }

      const result = await operation(connection, toDomain(row));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async persist(connection: PoolConnection, inventory: Inventory): Promise<void> {
    await connection.execute(
      `UPDATE inventory
       SET availableStock = ?, reservedStock = ?, totalStock = ?, updateDate = ?
       WHERE inventoryId = ?`,
      [
        inventory.availableStock,
        inventory.reservedStock,
        inventory.totalStock,
        inventory.updateDate,
        inventory.inventoryId,
      ],
    );
  }

  private async applyReservationDelta(
    connection: PoolConnection,
    inventoryId: string,
    orderId: string,
    delta: number,
  ): Promise<void> {
    if (delta > 0) {
      await connection.execute(
        `INSERT INTO inventory_reservations (reservationId, inventoryId, orderId, quantity, updateDate)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           quantity = quantity + VALUES(quantity),
           updateDate = VALUES(updateDate)`,
        [randomUUID(), inventoryId, orderId, delta, new Date()],
      );
      return;
    }

    await connection.execute(
      `UPDATE inventory_reservations
       SET quantity = quantity - ?, updateDate = ?
       WHERE inventoryId = ? AND orderId = ?`,
      [-delta, new Date(), inventoryId, orderId],
    );
    await connection.execute(
      `DELETE FROM inventory_reservations
       WHERE inventoryId = ? AND orderId = ? AND quantity <= 0`,
      [inventoryId, orderId],
    );
  }
}
