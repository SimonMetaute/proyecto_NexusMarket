/**
 * Controller: LogisticsController
 * Endpoints del operador de logística (requieren autenticación, rol LOGISTICS_OPERATOR).
 */
import type { Request, Response } from 'express';
import type { LogisticsOperatorPort } from '../../../domain/ports/in/LogisticsOperatorPort.js';
import type { User } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import {
  requireObject,
  requireString,
  requireParam,
  requirePositiveInt,
} from '../validation/validator.js';
import { Inventory } from '../../../domain/entities/Inventory.js';

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export class LogisticsController {
  private readonly logisticsService: LogisticsOperatorPort;

  constructor(logisticsService: LogisticsOperatorPort) {
    this.logisticsService = logisticsService;
  }

  private requireUser(req: Request): User {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    return user;
  }

  async consultOperationalWarehouses(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const warehouses = await this.logisticsService.consultOperationalWarehouses(user);
    res.status(200).json(warehouses);
  }

  async registerStockEntry(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const productId = requireString(body, 'productId', { maxLength: 36 });
    const warehouseId = requireString(body, 'warehouseId', { maxLength: 36 });
    const quantity = requirePositiveInt(body, 'quantity');
    const receiptReference = requireString(body, 'receiptReference', { maxLength: 255 });

    // The service reloads the Product and Warehouse aggregates, verifies they
    // exist and creates/increments inventory atomically by (product, warehouse).
    const inventory = new Inventory({
      inventoryId: globalThis.crypto.randomUUID(),
      productId,
      warehouseId,
      availableStock: 0,
      reservedStock: 0,
      totalStock: 0,
      updateDate: new Date(),
    });
    const updated = await this.logisticsService.registerStockEntry(
      user,
      inventory,
      { value: quantity },
      receiptReference,
    );
    res.status(200).json({
      inventoryId: updated.inventoryId,
      availableStock: updated.availableStock,
      totalStock: updated.totalStock,
    });
  }

  async dispatchShipment(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const shipmentId = requireParam(asString(req.params.shipmentId), 'shipmentId');
    const updated = await this.logisticsService.dispatchShipment(user, {
      shipmentId,
    } as any);
    res.status(200).json({
      shipmentId: updated.shipmentId,
      shipmentStatus: updated.shipmentStatus,
    });
  }

  async confirmDelivery(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const shipmentId = requireParam(asString(req.params.shipmentId), 'shipmentId');
    const updated = await this.logisticsService.confirmDelivery(user, {
      shipmentId,
    } as any);
    res.status(200).json({
      shipmentId: updated.shipmentId,
      shipmentStatus: updated.shipmentStatus,
    });
  }
}
