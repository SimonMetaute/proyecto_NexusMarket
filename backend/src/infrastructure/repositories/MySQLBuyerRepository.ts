import type { RowDataPacket } from 'mysql2/promise';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import { Buyer } from '../../domain/entities/Buyer.js';
import { pool } from '../database/mysql-pool.js';

interface BuyerRow extends RowDataPacket {
  buyerId: string;
  userId: string;
  trustLevel: string;
  lastPurchaseDate: Date | null;
}

export class MySQLBuyerRepository implements BuyerRepositoryPort {
  async save(buyer: Buyer): Promise<Buyer> {
    await pool.execute(
      `INSERT INTO buyers (buyerId, userId, trustLevel, lastPurchaseDate) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE trustLevel = VALUES(trustLevel), lastPurchaseDate = VALUES(lastPurchaseDate)`,
      [buyer.buyerId, buyer.userId, buyer.trustLevel, buyer.lastPurchaseDate ?? null],
    );
    return buyer;
  }

  async findByIdentifier(buyer: Buyer): Promise<Buyer | null> {
    const [rows] = await pool.query<BuyerRow[]>('SELECT * FROM buyers WHERE buyerId = ? LIMIT 1', [buyer.buyerId]);
    const row = rows[0];
    if (!row) return null;
    const params: any = { buyerId: row.buyerId, userId: row.userId, trustLevel: row.trustLevel as any };
    if (row.lastPurchaseDate) params.lastPurchaseDate = row.lastPurchaseDate;
    return new Buyer(params);
  }

  async findByUser(user: any): Promise<Buyer | null> {
    const [rows] = await pool.query<BuyerRow[]>('SELECT * FROM buyers WHERE userId = ? LIMIT 1', [user.userId]);
    const row = rows[0];
    if (!row) return null;
    const params: any = { buyerId: row.buyerId, userId: row.userId, trustLevel: row.trustLevel as any };
    if (row.lastPurchaseDate) params.lastPurchaseDate = row.lastPurchaseDate;
    return new Buyer(params);
  }

  async findByTrustLevel(trustLevel: any): Promise<Buyer[]> {
    const [rows] = await pool.query<BuyerRow[]>('SELECT * FROM buyers WHERE trustLevel = ?', [trustLevel]);
    return rows.map((row) => {
      const params: any = { buyerId: row.buyerId, userId: row.userId, trustLevel: row.trustLevel as any };
      if (row.lastPurchaseDate) params.lastPurchaseDate = row.lastPurchaseDate;
      return new Buyer(params);
    });
  }
}
