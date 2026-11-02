/**
 * Adapter: MockBusinessConfiguration.
 *
 * Reads marketplace-wide configuration from `appConfig` with dev defaults.
 */
import type { BusinessConfigurationPort } from '../../domain/ports/out/BusinessConfigurationPort.js';
import { appConfig } from '../config/appConfig.js';

export class MockBusinessConfiguration implements BusinessConfigurationPort {
  async getReturnPolicy(): Promise<{ returnWindowDays: number }> {
    return { returnWindowDays: 30 };
  }

  async getCommissionPolicy(): Promise<{ rate: number }> {
    return { rate: 0.05 };
  }

  async getTaxPolicy(): Promise<{ taxRate: number }> {
    return { taxRate: 0.19 };
  }

  async getShippingPolicy(): Promise<{ baseRate: number }> {
    return { baseRate: 5000 };
  }
}
