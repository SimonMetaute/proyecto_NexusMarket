import type { RowDataPacket } from 'mysql2/promise';
import type { ShoppingCartRepositoryPort } from '../../domain/ports/out/ShoppingCartRepositoryPort.js';
import { CartLine, CartStatus, ShoppingCart } from '../../domain/entities/ShoppingCart.js';
import type { Buyer } from '../../domain/entities/Buyer.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNumber } from './mappers/rowMappers.js';

interface CartRow extends RowDataPacket {
  cartId: string;
  buyerId: string;
  subtotal: number | string;
  total: number | string;
  status: string;
  updateDate: Date | string;
}

interface CartLineRow extends RowDataPacket {
  cartLineId: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number | string;
  unitPrice: number | string;
}

function lineToDomain(row: CartLineRow): CartLine {
  const params: {
    cartLineId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  } = {
    cartLineId: row.cartLineId,
    productId: row.productId,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unitPrice),
  };
  if (row.variantId !== null) {
    params.variantId = row.variantId;
  }
  return new CartLine(params);
}

function cartToDomain(row: CartRow, lines: CartLineRow[]): ShoppingCart {
  return new ShoppingCart({
    cartId: row.cartId,
    buyerId: row.buyerId,
    cartLines: lines.map(lineToDomain),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    updateDate: toDate(row.updateDate),
    status: row.status as CartStatus,
  });
}

export class MySQLShoppingCartRepository implements ShoppingCartRepositoryPort {
  private async loadLines(cartId: string): Promise<CartLineRow[]> {
    const [rows] = await pool.query<CartLineRow[]>(
      'SELECT * FROM cart_lines WHERE cartId = ?',
      [cartId],
    );
    return rows;
  }

  private async loadCart(row: CartRow): Promise<ShoppingCart> {
    const lines = await this.loadLines(row.cartId);
    return cartToDomain(row, lines);
  }

  async save(cart: ShoppingCart): Promise<ShoppingCart> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO shopping_carts (cartId, buyerId, subtotal, total, status, updateDate)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           buyerId = VALUES(buyerId),
           subtotal = VALUES(subtotal),
           total = VALUES(total),
           status = VALUES(status),
           updateDate = VALUES(updateDate)`,
        [cart.cartId, cart.buyerId, cart.subtotal, cart.total, cart.status, cart.updateDate],
      );

      // The aggregate owns its lines: replace them atomically.
      await connection.execute('DELETE FROM cart_lines WHERE cartId = ?', [cart.cartId]);

      for (const line of cart.cartLines) {
        await connection.execute(
          `INSERT INTO cart_lines (cartLineId, cartId, productId, variantId, quantity, unitPrice)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            line.cartLineId,
            cart.cartId,
            line.productId,
            line.variantId ?? null,
            line.quantity,
            line.unitPrice,
          ],
        );
      }

      await connection.commit();
      return cart;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findOpenByBuyer(buyer: Buyer): Promise<ShoppingCart | null> {
    const [rows] = await pool.query<CartRow[]>(
      'SELECT * FROM shopping_carts WHERE buyerId = ? AND status = ? ORDER BY updateDate DESC LIMIT 1',
      [buyer.buyerId, CartStatus.OPEN],
    );
    const row = rows[0];
    return row === undefined ? null : this.loadCart(row);
  }

  async findByIdentifier(cart: ShoppingCart): Promise<ShoppingCart | null> {
    const [rows] = await pool.query<CartRow[]>(
      'SELECT * FROM shopping_carts WHERE cartId = ? LIMIT 1',
      [cart.cartId],
    );
    const row = rows[0];
    return row === undefined ? null : this.loadCart(row);
  }

  async delete(cart: ShoppingCart): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM cart_lines WHERE cartId = ?', [cart.cartId]);
      await connection.execute('DELETE FROM shopping_carts WHERE cartId = ?', [cart.cartId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
