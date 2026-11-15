import type { RowDataPacket } from 'mysql2/promise';
import type { ShipmentRepositoryPort, ShipmentQueryFilters } from '../../domain/ports/out/ShipmentRepositoryPort.js';
import { Carrier, Shipment } from '../../domain/entities/Shipment.js';
import type { Order } from '../../domain/entities/Order.js';
import { ShipmentStatus } from '../../domain/model/enums.js';
import { pool } from '../database/mysql-pool.js';
import { getExecutor } from '../database/mysql-transaction.js';
import { toDate, toNullableDate } from './mappers/rowMappers.js';
import { deliveryAddressFromJson, deliveryAddressToJson } from './mappers/valueObjectMappers.js';

interface ShipmentRow extends RowDataPacket {
  shipmentId: string;
  orderId: string;
  warehouseId: string;
  deliveryAddressJson: string;
  carrierId: string;
  carrierName: string;
  carrierServiceType: string;
  trackingCode: string;
  shipmentStatus: string;
  departureDate: Date | string | null;
  deliveryDate: Date | string | null;
}

function toDomain(row: ShipmentRow): Shipment {
  const params: {
    shipmentId: string;
    orderId: string;
    warehouseId: string;
    deliveryAddress: ReturnType<typeof deliveryAddressFromJson>;
    carrier: Carrier;
    trackingCode: string;
    shipmentStatus: ShipmentStatus;
    departureDate?: Date;
    deliveryDate?: Date;
  } = {
    shipmentId: row.shipmentId,
    orderId: row.orderId,
    warehouseId: row.warehouseId,
    deliveryAddress: deliveryAddressFromJson(row.deliveryAddressJson),
    carrier: new Carrier({
      carrierId: row.carrierId,
      name: row.carrierName,
      serviceType: row.carrierServiceType,
    }),
    trackingCode: row.trackingCode,
    shipmentStatus: row.shipmentStatus as ShipmentStatus,
  };

  const departureDate = toNullableDate(row.departureDate);
  if (departureDate !== undefined) {
    params.departureDate = departureDate;
  }
  const deliveryDate = toNullableDate(row.deliveryDate);
  if (deliveryDate !== undefined) {
    params.deliveryDate = deliveryDate;
  }

  return new Shipment(params);
}

function toNullableSecondPrecision(value: Date | undefined): Date | null {
  if (value === undefined) {
    return null;
  }
  // MySQL DATETIME(0) rounds fractional seconds, so `…:17.700` would become
  // `…:18.000` (a future instant that breaks the return-window validation).
  const truncated = new Date(value.getTime());
  truncated.setMilliseconds(0);
  return truncated;
}

export class MySQLShipmentRepository implements ShipmentRepositoryPort {
  async save(shipment: Shipment): Promise<Shipment> {
    await getExecutor().execute(
      `INSERT INTO shipments (
        shipmentId, orderId, warehouseId, deliveryAddressJson, carrierId,
        carrierName, carrierServiceType, trackingCode, shipmentStatus,
        departureDate, deliveryDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        orderId = VALUES(orderId),
        warehouseId = VALUES(warehouseId),
        deliveryAddressJson = VALUES(deliveryAddressJson),
        carrierId = VALUES(carrierId),
        carrierName = VALUES(carrierName),
        carrierServiceType = VALUES(carrierServiceType),
        trackingCode = VALUES(trackingCode),
        shipmentStatus = VALUES(shipmentStatus),
        departureDate = VALUES(departureDate),
        deliveryDate = VALUES(deliveryDate)`,
      [
        shipment.shipmentId,
        shipment.orderId,
        shipment.warehouseId,
        deliveryAddressToJson(shipment.deliveryAddress),
        shipment.carrier.carrierId,
        shipment.carrier.name,
        shipment.carrier.serviceType,
        shipment.trackingCode,
        shipment.shipmentStatus,
        toNullableSecondPrecision(shipment.departureDate),
        toNullableSecondPrecision(shipment.deliveryDate),
      ],
    );
    return shipment;
  }

  async findByIdentifier(shipment: Shipment): Promise<Shipment | null> {
    const [rows] = await pool.query<ShipmentRow[]>(
      'SELECT * FROM shipments WHERE shipmentId = ? LIMIT 1',
      [shipment.shipmentId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByOrder(order: Order): Promise<Shipment[]> {
    const [rows] = await pool.query<ShipmentRow[]>(
      'SELECT * FROM shipments WHERE orderId = ?',
      [order.orderId],
    );
    return rows.map(toDomain);
  }

  async findByTrackingCode(trackingCode: string): Promise<Shipment | null> {
    const [rows] = await pool.query<ShipmentRow[]>(
      'SELECT * FROM shipments WHERE trackingCode = ? LIMIT 1',
      [trackingCode],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByStatus(status: ShipmentStatus): Promise<Shipment[]> {
    const [rows] = await pool.query<ShipmentRow[]>(
      'SELECT * FROM shipments WHERE shipmentStatus = ?',
      [status],
    );
    return rows.map(toDomain);
  }

  async findAll(filters: ShipmentQueryFilters = {}): Promise<Shipment[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filters.status !== undefined) {
      conditions.push('shipmentStatus = ?');
      params.push(filters.status);
    }
    if (filters.warehouseId !== undefined) {
      conditions.push('warehouseId = ?');
      params.push(filters.warehouseId);
    }
    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query<ShipmentRow[]>(
      `SELECT * FROM shipments${where} ORDER BY shipmentId DESC`,
      params,
    );
    return rows.map(toDomain);
  }
}
