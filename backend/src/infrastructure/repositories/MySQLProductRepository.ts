import type { RowDataPacket } from 'mysql2/promise';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import { Product } from '../../domain/entities/Product.js';
import { pool } from '../database/mysql-pool.js';

interface ProductRow extends RowDataPacket {
  productId: string;
  name: string;
  description: string;
  price: number | string;
  sellerId: string;
  stock: number | string;
  createdAt: Date | string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function toDomain(row: ProductRow): Product {
  return new Product({
    productId: row.productId,
    name: row.name,
    description: row.description,
    price: toNumber(row.price),
    sellerId: row.sellerId,
    stock: toNumber(row.stock),
    createdAt: toDate(row.createdAt),
  });
}

export class MySQLProductRepository implements ProductRepository {
  async save(product: Product): Promise<void> {
    await pool.execute(
      `INSERT INTO products (
        productId, name, description, price, sellerId, stock, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        price = VALUES(price),
        sellerId = VALUES(sellerId),
        stock = VALUES(stock),
        createdAt = VALUES(createdAt)`,
      [
        product.productId,
        product.name,
        product.description,
        product.price,
        product.sellerId,
        product.stock,
        product.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<Product | null> {
    const [rows] = await pool.query<ProductRow[]>('SELECT * FROM products WHERE productId = ? LIMIT 1', [id]);
    const row = rows[0];
    if (row === undefined) {
      return null;
    }
    return toDomain(row);
  }

  async findAll(): Promise<Product[]> {
    const [rows] = await pool.query<ProductRow[]>('SELECT * FROM products');
    return rows.map(toDomain);
  }
}
