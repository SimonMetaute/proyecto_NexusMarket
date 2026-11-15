import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './mysql-pool.js';

/**
 * Ensures tables exist, mapping aggregates to persistence.
 * Idempotent: safe to run on every boot.
 */
export async function initDb(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      userId VARCHAR(36) PRIMARY KEY,
      userType VARCHAR(50) NOT NULL,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      identityDocumentType VARCHAR(50) NOT NULL,
      identityDocumentNumber VARCHAR(100) NOT NULL,
      registrationDate DATETIME NOT NULL,
      status VARCHAR(50) NOT NULL,
      updateDate DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      productId VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100),
      sku VARCHAR(100) UNIQUE,
      sellerId VARCHAR(36) NOT NULL,
      basePrice DECIMAL(10, 2),
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      productStatus VARCHAR(50),
      publicationDate DATETIME,
      brand VARCHAR(100),
      stock INT NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_images (
      imageId VARCHAR(36) PRIMARY KEY,
      productId VARCHAR(36) NOT NULL,
      url VARCHAR(1024) NOT NULL,
      altText VARCHAR(255),
      position INT NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      INDEX idx_product_images_product (productId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS buyers (
      buyerId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL UNIQUE,
      trustLevel VARCHAR(50),
      lastPurchaseDate DATETIME,
      deliveryAddressesJson TEXT,
      paymentMethodsJson TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sellers (
      sellerId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL UNIQUE,
      commercialName VARCHAR(255) NOT NULL UNIQUE,
      personType VARCHAR(50) NOT NULL,
      verificationStatus VARCHAR(50) NOT NULL,
      storeId VARCHAR(36),
      commercialAccountId VARCHAR(36),
      reputation DECIMAL(3,2) DEFAULT 0,
      approvalDate DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS stores (
      storeId VARCHAR(36) PRIMARY KEY,
      sellerId VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      storeCategory VARCHAR(100),
      status VARCHAR(50) NOT NULL,
      creationDate DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS warehouses (
      warehouseId VARCHAR(36) PRIMARY KEY,
      sellerId VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      location_json TEXT,
      capacity DECIMAL(10,2),
      status VARCHAR(50) NOT NULL,
      creationDate DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS shopping_carts (
      cartId VARCHAR(36) PRIMARY KEY,
      buyerId VARCHAR(36) NOT NULL,
      subtotal DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(50) NOT NULL,
      updateDate DATETIME NOT NULL,
      INDEX idx_carts_buyer_status (buyerId, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cart_lines (
      cartLineId VARCHAR(36) PRIMARY KEY,
      cartId VARCHAR(36) NOT NULL,
      productId VARCHAR(36) NOT NULL,
      variantId VARCHAR(36),
      quantity INT NOT NULL,
      unitPrice DECIMAL(10,2) NOT NULL,
      INDEX idx_cart_lines_cart (cartId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId VARCHAR(36) PRIMARY KEY,
      buyerId VARCHAR(36) NOT NULL,
      sellerId VARCHAR(36) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      taxes DECIMAL(10,2) NOT NULL,
      shippingCost DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      orderStatus VARCHAR(50) NOT NULL,
      creationDate DATETIME NOT NULL,
      estimatedDeliveryDate DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_lines (
      orderLineId VARCHAR(36) PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      productId VARCHAR(36) NOT NULL,
      variantId VARCHAR(36),
      quantity INT NOT NULL,
      unitPrice DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      INDEX idx_order_lines_order (orderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_variants (
      variantId VARCHAR(36) PRIMARY KEY,
      productId VARCHAR(36) NOT NULL,
      attribute VARCHAR(100) NOT NULL,
      value VARCHAR(255) NOT NULL,
      additionalPrice DECIMAL(12,2) NOT NULL DEFAULT 0,
      skuVariant VARCHAR(100) NOT NULL UNIQUE,
      UNIQUE KEY uq_variant_product_attr (productId, attribute, value),
      INDEX idx_variants_product (productId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inventory (
      inventoryId VARCHAR(36) PRIMARY KEY,
      productId VARCHAR(36) NOT NULL,
      warehouseId VARCHAR(36) NOT NULL,
      availableStock INT NOT NULL DEFAULT 0,
      reservedStock INT NOT NULL DEFAULT 0,
      totalStock INT NOT NULL DEFAULT 0,
      updateDate DATETIME NOT NULL,
      UNIQUE KEY uq_inventory_product_warehouse (productId, warehouseId),
      INDEX idx_inventory_warehouse (warehouseId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inventory_reservations (
      reservationId VARCHAR(36) PRIMARY KEY,
      inventoryId VARCHAR(36) NOT NULL,
      orderId VARCHAR(36) NOT NULL,
      quantity INT NOT NULL,
      updateDate DATETIME NOT NULL,
      UNIQUE KEY uq_reservation_inventory_order (inventoryId, orderId),
      INDEX idx_reservations_order (orderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      paymentId VARCHAR(36) PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      paymentMethodJson TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currencyCode VARCHAR(3) NOT NULL,
      paymentStatus VARCHAR(50) NOT NULL,
      externalTransactionId VARCHAR(255),
      processingDate DATETIME,
      INDEX idx_payments_order (orderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoiceId VARCHAR(36) PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL UNIQUE,
      invoiceNumber VARCHAR(100) NOT NULL UNIQUE,
      issueDate DATETIME NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      taxes DECIMAL(12,2) NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      currencyCode VARCHAR(3) NOT NULL,
      invoiceStatus VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS shipments (
      shipmentId VARCHAR(36) PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      warehouseId VARCHAR(36) NOT NULL,
      deliveryAddressJson TEXT NOT NULL,
      carrierId VARCHAR(36) NOT NULL,
      carrierName VARCHAR(255) NOT NULL,
      carrierServiceType VARCHAR(100) NOT NULL,
      trackingCode VARCHAR(100) NOT NULL UNIQUE,
      shipmentStatus VARCHAR(50) NOT NULL,
      departureDate DATETIME,
      deliveryDate DATETIME,
      INDEX idx_shipments_order (orderId),
      INDEX idx_shipments_warehouse (warehouseId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_returns (
      returnId VARCHAR(36) PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      invoiceId VARCHAR(36) NOT NULL,
      reason VARCHAR(50) NOT NULL,
      returnStatus VARCHAR(50) NOT NULL,
      requestDate DATETIME NOT NULL,
      refundAmount DECIMAL(12,2) NOT NULL,
      evidence TEXT,
      INDEX idx_returns_order (orderId),
      INDEX idx_returns_invoice (invoiceId),
      INDEX idx_returns_status (returnStatus)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS operations (
      operationId VARCHAR(36) PRIMARY KEY,
      operationType VARCHAR(80) NOT NULL,
      executionDate DATETIME NOT NULL,
      performedByUserId VARCHAR(36) NOT NULL,
      affectedEntity VARCHAR(36) NOT NULL,
      affectedEntityType VARCHAR(100) NOT NULL,
      INDEX idx_operations_actor (performedByUserId),
      INDEX idx_operations_entity (affectedEntity),
      INDEX idx_operations_type (operationType)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await migrateLegacySchema();
}

/**
 * `CREATE TABLE IF NOT EXISTS` does not evolve tables created by older
 * versions of this project. These idempotent migrations keep existing
 * development databases usable without dropping data.
 */
async function migrateLegacySchema(): Promise<void> {
  // Backfill `price` only when the column is first introduced, so later
  // legitimate zero-price products are never overwritten.
  if (!(await columnExists('products', 'price'))) {
    await pool.execute('ALTER TABLE products ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0');
    await pool.execute('UPDATE products SET price = basePrice WHERE basePrice IS NOT NULL');
  }

  await addColumnIfMissing('products', 'stock', 'INT NOT NULL DEFAULT 0');

  await addColumnIfMissing('products', 'createdAt', 'DATETIME NULL');
  await pool.execute('UPDATE products SET createdAt = NOW() WHERE createdAt IS NULL');
  if (await columnIsNullable('products', 'createdAt')) {
    await pool.execute('ALTER TABLE products MODIFY COLUMN createdAt DATETIME NOT NULL');
  }

  // The first schema made every catalogue attribute mandatory; the domain
  // models them as optional (`category`, `sku`, `basePrice`, etc.).
  const [legacyNotNull] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('category', 'sku', 'basePrice', 'productStatus', 'publicationDate', 'brand')
       AND IS_NULLABLE = 'NO'`,
  );
  if (legacyNotNull.length > 0) {
    await pool.execute(`
      ALTER TABLE products
        MODIFY COLUMN category VARCHAR(100) NULL,
        MODIFY COLUMN sku VARCHAR(100) NULL,
        MODIFY COLUMN basePrice DECIMAL(10,2) NULL,
        MODIFY COLUMN productStatus VARCHAR(50) NULL,
        MODIFY COLUMN publicationDate DATETIME NULL,
        MODIFY COLUMN brand VARCHAR(100) NULL
    `);
  }

  await addColumnIfMissing('buyers', 'deliveryAddressesJson', 'TEXT NULL');
  await addColumnIfMissing('buyers', 'paymentMethodsJson', 'TEXT NULL');

  // Physical reception timestamp for returns (logistics inbox).
  await addColumnIfMissing('product_returns', 'receivedDate', 'DATETIME NULL');

  // One shipment per order: makes the automatic creation idempotent even under
  // concurrent `prepare` calls.
  await addUniqueIndexIfMissing('shipments', 'uq_shipments_order', 'orderId');

  // Early builds named this column `attributeValue`; the canonical name is `value`.
  const hasAttributeValue = await columnExists('product_variants', 'attributeValue');
  const hasValue = await columnExists('product_variants', 'value');
  if (hasAttributeValue && !hasValue) {
    await pool.execute(
      'ALTER TABLE product_variants CHANGE COLUMN attributeValue value VARCHAR(255) NOT NULL',
    );
  }
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function columnIsNullable(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  const row = rows[0];
  return row !== undefined && row.IS_NULLABLE === 'YES';
}

async function addColumnIfMissing(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (!(await columnExists(table, column))) {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function indexExists(table: string, indexName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [table, indexName],
  );
  return rows.length > 0;
}

async function addUniqueIndexIfMissing(
  table: string,
  indexName: string,
  column: string,
): Promise<void> {
  if (await indexExists(table, indexName)) {
    return;
  }
  // Older rows may predate idempotent creation; keep one shipment per order
  // before enforcing the constraint.
  await pool.execute(`
    DELETE FROM \`${table}\`
    WHERE shipmentId NOT IN (
      SELECT kept FROM (
        SELECT MIN(shipmentId) AS kept FROM \`${table}\` GROUP BY ${column}
      ) AS dedupe
    )
  `);
  await pool.execute(
    `ALTER TABLE \`${table}\` ADD UNIQUE INDEX \`${indexName}\` (${column})`,
  );
}
