import type { RowDataPacket } from 'mysql2/promise';
import type { WarehouseRepositoryPort } from '../../domain/ports/out/WarehouseRepositoryPort.js';
import { Warehouse } from '../../domain/entities/Warehouse.js';
import type { Seller } from '../../domain/entities/Seller.js';
import { WarehouseStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { toDate, toNumber } from './mappers/rowMappers.js';
import { warehouseLocationFromJson, warehouseLocationToJson } from './mappers/valueObjectMappers.js';

interface WarehouseRow extends RowDataPacket {
  warehouseId: string;
  sellerId: string;
  name: string;
  location_json: string;
  capacity: number | string;
  status: string;
  creationDate: Date | string;
}

function toDomain(row: WarehouseRow): Warehouse {
  return new Warehouse({
    warehouseId: row.warehouseId,
    sellerId: row.sellerId,
    name: row.name,
    location: warehouseLocationFromJson(row.location_json),
    capacity: toNumber(row.capacity),
    status: row.status as WarehouseStatus,
    creationDate: toDate(row.creationDate),
  });
}

export class MySQLWarehouseRepository implements WarehouseRepositoryPort {
  async save(warehouse: Warehouse): Promise<Warehouse> {
    await pool.execute(
      `INSERT INTO warehouses (warehouseId, sellerId, name, location_json, capacity, status, creationDate)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sellerId = VALUES(sellerId),
         name = VALUES(name),
         location_json = VALUES(location_json),
         capacity = VALUES(capacity),
         status = VALUES(status)`,
      [
        warehouse.warehouseId,
        warehouse.sellerId,
        warehouse.name,
        warehouseLocationToJson(warehouse.location),
        warehouse.capacity,
        warehouse.status,
        warehouse.creationDate,
      ],
    );
    return warehouse;
  }

  async findByIdentifier(warehouse: Warehouse): Promise<Warehouse | null> {
    const [rows] = await pool.query<WarehouseRow[]>(
      'SELECT * FROM warehouses WHERE warehouseId = ? LIMIT 1',
      [warehouse.warehouseId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findBySeller(seller: Seller): Promise<Warehouse[]> {
    const [rows] = await pool.query<WarehouseRow[]>(
      'SELECT * FROM warehouses WHERE sellerId = ?',
      [seller.sellerId],
    );
    return rows.map(toDomain);
  }

  async findByStatus(status: WarehouseStatus): Promise<Warehouse[]> {
    const [rows] = await pool.query<WarehouseRow[]>(
      'SELECT * FROM warehouses WHERE status = ?',
      [status],
    );
    return rows.map(toDomain);
  }
}
