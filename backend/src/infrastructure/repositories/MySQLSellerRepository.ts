import type { RowDataPacket } from 'mysql2/promise';
import type { SellerRepositoryPort } from '../../domain/ports/out/SellerRepositoryPort.js';
import { Seller } from '../../domain/entities/Seller.js';
import { pool } from '../database/mysql-pool.js';
import { PersonType, SellerVerificationStatus } from '../../domain/model/enums.js';

interface SellerRow extends RowDataPacket {
  sellerId: string;
  userId: string;
  commercialName: string;
  personType: string;
  verificationStatus: string;
  storeId: string | null;
  commercialAccountId: string | null;
  reputation: number;
  approvalDate: Date | null;
}

function toDomain(row: SellerRow): Seller {
  const params: any = {
    sellerId: row.sellerId,
    userId: row.userId,
    commercialName: row.commercialName,
    personType: row.personType as PersonType,
    verificationStatus: row.verificationStatus as SellerVerificationStatus,
    reputation: Number(row.reputation),
  };
  if (row.storeId) params.storeId = row.storeId;
  if (row.commercialAccountId) params.commercialAccountId = row.commercialAccountId;
  if (row.approvalDate) params.approvalDate = row.approvalDate;
  return new Seller(params);
}

export class MySQLSellerRepository implements SellerRepositoryPort {
  async save(seller: Seller): Promise<Seller> {
    await pool.execute(
      `INSERT INTO sellers (sellerId, userId, commercialName, personType, verificationStatus, storeId, commercialAccountId, reputation, approvalDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE commercialName = VALUES(commercialName), personType = VALUES(personType), verificationStatus = VALUES(verificationStatus), storeId = VALUES(storeId), commercialAccountId = VALUES(commercialAccountId), reputation = VALUES(reputation), approvalDate = VALUES(approvalDate)`,
      [seller.sellerId, seller.userId, seller.commercialName, seller.personType, seller.verificationStatus, seller.storeId ?? null, seller.commercialAccountId ?? null, seller.reputation, seller.approvalDate ?? null],
    );
    return seller;
  }

  async findByIdentifier(seller: Seller): Promise<Seller | null> {
    const [rows] = await pool.query<SellerRow[]>('SELECT * FROM sellers WHERE sellerId = ? LIMIT 1', [seller.sellerId]);
    const row = rows[0];
    if (!row) return null;
    return toDomain(row);
  }

  async findByUser(user: any): Promise<Seller | null> {
    const [rows] = await pool.query<SellerRow[]>('SELECT * FROM sellers WHERE userId = ? LIMIT 1', [user.userId]);
    const row = rows[0];
    if (!row) return null;
    return toDomain(row);
  }

  async findByCommercialName(commercialName: string): Promise<Seller | null> {
    const [rows] = await pool.query<SellerRow[]>('SELECT * FROM sellers WHERE commercialName = ? LIMIT 1', [commercialName]);
    const row = rows[0];
    if (!row) return null;
    return toDomain(row);
  }

  async findByVerificationStatus(status: SellerVerificationStatus): Promise<Seller[]> {
    const [rows] = await pool.query<SellerRow[]>('SELECT * FROM sellers WHERE verificationStatus = ?', [status]);
    return rows.map(toDomain);
  }
}
