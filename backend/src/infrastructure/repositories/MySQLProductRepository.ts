import type { RowDataPacket } from 'mysql2/promise';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import { Product } from '../../domain/entities/Product.js';
import { ProductCategory, ProductStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNullableDate, toNumber } from './mappers/rowMappers.js';

interface ProductRow extends RowDataPacket {
  productId: string;
  name: string;
  description: string;
  category: string | null;
  sku: string | null;
  sellerId: string;
  basePrice: number | string | null;
  price: number | string;
  productStatus: string | null;
  publicationDate: Date | string | null;
  brand: string | null;
  stock: number | string;
  createdAt: Date | string;
}

function toDomain(row: ProductRow): Product {
  const params: {
    productId: string;
    name: string;
    description: string;
    category?: ProductCategory;
    sku?: string;
    sellerId: string;
    basePrice?: number;
    price: number;
    productStatus?: ProductStatus;
    publicationDate?: Date;
    brand?: string;
    stock: number;
    createdAt: Date;
  } = {
    productId: row.productId,
    name: row.name,
    description: row.description,
    sellerId: row.sellerId,
    price: toNumber(row.price),
    stock: toNumber(row.stock),
    createdAt: toDate(row.createdAt),
  };

  if (row.category !== null) {
    params.category = row.category as ProductCategory;
  }
  if (row.sku !== null) {
    params.sku = row.sku;
  }
  if (row.basePrice !== null) {
    params.basePrice = toNumber(row.basePrice);
  }
  if (row.productStatus !== null) {
    params.productStatus = row.productStatus as ProductStatus;
  }
  const publicationDate = toNullableDate(row.publicationDate);
  if (publicationDate !== undefined) {
    params.publicationDate = publicationDate;
  }
  if (row.brand !== null) {
    params.brand = row.brand;
  }

  return new Product(params);
}

export class MySQLProductRepository implements ProductRepository {
  async save(product: Product): Promise<void> {
    await pool.execute(
      `INSERT INTO products (
        productId, name, description, category, sku, sellerId, basePrice,
        price, productStatus, publicationDate, brand, stock, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        category = VALUES(category),
        sku = VALUES(sku),
        sellerId = VALUES(sellerId),
        basePrice = VALUES(basePrice),
        price = VALUES(price),
        productStatus = VALUES(productStatus),
        publicationDate = VALUES(publicationDate),
        brand = VALUES(brand),
        stock = VALUES(stock),
        createdAt = VALUES(createdAt)`,
      [
        product.productId,
        product.name,
        product.description,
        product.category ?? null,
        product.sku ?? null,
        product.sellerId,
        product.basePrice ?? null,
        product.price,
        product.productStatus ?? null,
        product.publicationDate ?? null,
        product.brand ?? null,
        product.stock,
        product.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<Product | null> {
    const [rows] = await pool.query<ProductRow[]>(
      'SELECT * FROM products WHERE productId = ? LIMIT 1',
      [id],
    );
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

  async findBySellerId(sellerId: string): Promise<Product[]> {
    const [rows] = await pool.query<ProductRow[]>(
      'SELECT * FROM products WHERE sellerId = ? ORDER BY createdAt DESC',
      [sellerId],
    );
    return rows.map(toDomain);
  }
}
