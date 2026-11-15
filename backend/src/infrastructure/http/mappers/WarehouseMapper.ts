/**
 * Mapper: Warehouse
 * Normaliza la entidad de dominio a un DTO camelCase sin campos internos
 * (evita filtrar `_country`, `_department`, ... del value object `location`).
 */
import type { Warehouse } from '../../../domain/entities/Warehouse.js';

export interface WarehouseLocationResponse {
  country: string;
  department: string;
  city: string;
  address: string;
  postalCode: string;
  coordinates?: string;
}

export interface WarehouseResponse {
  warehouseId: string;
  sellerId: string;
  name: string;
  location: WarehouseLocationResponse;
  capacity: number;
  status: string;
  creationDate: Date;
}

export function toWarehouseResponse(warehouse: Warehouse): WarehouseResponse {
  const location = warehouse.location;
  const locationResponse: WarehouseLocationResponse = {
    country: location.country,
    department: location.department,
    city: location.city,
    address: location.address,
    postalCode: location.postalCode,
  };
  if (location.coordinates !== undefined) {
    locationResponse.coordinates = location.coordinates;
  }

  return {
    warehouseId: warehouse.warehouseId,
    sellerId: warehouse.sellerId,
    name: warehouse.name,
    location: locationResponse,
    capacity: warehouse.capacity,
    status: warehouse.status,
    creationDate: warehouse.creationDate,
  };
}
