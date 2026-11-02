import type { RowDataPacket } from 'mysql2/promise';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import { Buyer } from '../../domain/entities/Buyer.js';
import type { BuyerTrustLevel } from '../../domain/entities/Buyer.js';
import type { User } from '../../domain/model/user.js';
import { pool } from '../database/mysql-pool.js';
import { toNullableDate } from './mappers/rowMappers.js';
import {
  deliveryAddressesFromJson,
  deliveryAddressesToJson,
  paymentMethodsFromJson,
  paymentMethodsToJson,
} from './mappers/valueObjectMappers.js';

interface BuyerRow extends RowDataPacket {
  buyerId: string;
  userId: string;
  trustLevel: string | null;
  lastPurchaseDate: Date | string | null;
  deliveryAddressesJson: string | null;
  paymentMethodsJson: string | null;
}

function toDomain(row: BuyerRow): Buyer {
  const params: {
    buyerId: string;
    userId: string;
    deliveryAddresses: ReturnType<typeof deliveryAddressesFromJson>;
    paymentMethods: ReturnType<typeof paymentMethodsFromJson>;
    trustLevel?: BuyerTrustLevel;
    lastPurchaseDate?: Date;
  } = {
    buyerId: row.buyerId,
    userId: row.userId,
    deliveryAddresses: deliveryAddressesFromJson(row.deliveryAddressesJson),
    paymentMethods: paymentMethodsFromJson(row.paymentMethodsJson),
  };

  if (row.trustLevel !== null) {
    params.trustLevel = row.trustLevel as BuyerTrustLevel;
  }
  const lastPurchaseDate = toNullableDate(row.lastPurchaseDate);
  if (lastPurchaseDate !== undefined) {
    params.lastPurchaseDate = lastPurchaseDate;
  }

  return new Buyer(params);
}

export class MySQLBuyerRepository implements BuyerRepositoryPort {
  async save(buyer: Buyer): Promise<Buyer> {
    await pool.execute(
      `INSERT INTO buyers (
        buyerId, userId, trustLevel, lastPurchaseDate,
        deliveryAddressesJson, paymentMethodsJson
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userId = VALUES(userId),
        trustLevel = VALUES(trustLevel),
        lastPurchaseDate = VALUES(lastPurchaseDate),
        deliveryAddressesJson = VALUES(deliveryAddressesJson),
        paymentMethodsJson = VALUES(paymentMethodsJson)`,
      [
        buyer.buyerId,
        buyer.userId,
        buyer.trustLevel,
        buyer.lastPurchaseDate ?? null,
        deliveryAddressesToJson(buyer.deliveryAddresses),
        paymentMethodsToJson(buyer.paymentMethods),
      ],
    );
    return buyer;
  }

  async findByIdentifier(buyer: Buyer): Promise<Buyer | null> {
    const [rows] = await pool.query<BuyerRow[]>(
      'SELECT * FROM buyers WHERE buyerId = ? LIMIT 1',
      [buyer.buyerId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByUser(user: User): Promise<Buyer | null> {
    const [rows] = await pool.query<BuyerRow[]>(
      'SELECT * FROM buyers WHERE userId = ? LIMIT 1',
      [user.userId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByTrustLevel(trustLevel: BuyerTrustLevel): Promise<Buyer[]> {
    const [rows] = await pool.query<BuyerRow[]>(
      'SELECT * FROM buyers WHERE trustLevel = ?',
      [trustLevel],
    );
    return rows.map(toDomain);
  }
}
