import type { Shipment } from '../../../domain/entities/Shipment.js';

/**
 * Maps the logistics aggregates to the REST representation. The contract
 * exposes both `shipmentStatus` and `status` so dashboards can reuse the same
 * badge helpers as the rest of the portals.
 */
export function toShipmentResponse(shipment: Shipment): Record<string, unknown> {
  return {
    shipmentId: shipment.shipmentId,
    orderId: shipment.orderId,
    warehouseId: shipment.warehouseId,
    trackingCode: shipment.trackingCode,
    carrier: {
      carrierId: shipment.carrier.carrierId,
      name: shipment.carrier.name,
      serviceType: shipment.carrier.serviceType,
    },
    shipmentStatus: shipment.shipmentStatus,
    status: shipment.shipmentStatus,
    deliveryAddress: {
      addressId: shipment.deliveryAddress.addressId,
      country: shipment.deliveryAddress.country,
      department: shipment.deliveryAddress.department,
      city: shipment.deliveryAddress.city,
      neighborhood: shipment.deliveryAddress.neighborhood,
      address: shipment.deliveryAddress.address,
      postalCode: shipment.deliveryAddress.postalCode,
      reference: shipment.deliveryAddress.reference,
      isPrimary: shipment.deliveryAddress.isPrimary,
    },
    departureDate: shipment.departureDate,
    deliveryDate: shipment.deliveryDate,
  };
}
