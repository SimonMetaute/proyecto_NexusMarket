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
      price DECIMAL(10, 2),
      productStatus VARCHAR(50),
      publicationDate DATETIME,
      brand VARCHAR(100),
      stock INT DEFAULT 0,
      createdAt DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS buyers (
      buyerId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL UNIQUE,
      trustLevel VARCHAR(50),
      lastPurchaseDate DATETIME
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
      updateDate DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cart_lines (
      cartLineId VARCHAR(36) PRIMARY KEY,
      cartId VARCHAR(36) NOT NULL,
      productId VARCHAR(36) NOT NULL,
      variantId VARCHAR(36),
      quantity INT NOT NULL,
      unitPrice DECIMAL(10,2) NOT NULL
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
      subtotal DECIMAL(10,2) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
