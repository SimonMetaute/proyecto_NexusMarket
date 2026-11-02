/**
 * Adapter: MockLogisticsIntegration.
 *
 * Development-grade stub of `LogisticsIntegrationPort`.
 */
import type { LogisticsIntegrationPort } from '../../domain/ports/out/LogisticsIntegrationPort.js';
import type { Shipment } from '../../domain/entities/Shipment.js';

export class MockLogisticsIntegration implements LogisticsIntegrationPort {
  async dispatch(shipment: Shipment): Promise<{ dispatched: boolean; trackingCode?: string }> {
    return { dispatched: true, trackingCode: `MOCK-${shipment.trackingCode}` };
  }

  async getTracking(shipment: Shipment): Promise<{ status: string; updates: any[] }> {
    return { status: 'IN_TRANSIT', updates: [] };
  }

  async confirmDelivery(shipment: Shipment): Promise<{ delivered: boolean; date?: Date }> {
    return { delivered: true, date: new Date() };
  }

  async resolveException(shipment: Shipment): Promise<{ resolved: boolean }> {
    return { resolved: true };
  }
}
