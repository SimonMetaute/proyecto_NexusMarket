/**
 * Service Port: BusinessConfigurationPort
 * Source: SDD/Domain/output-ports.md (Section 4.21)
 */

export interface ReturnPolicy {
  returnWindowDays: number;
}

export interface CommissionPolicy {
  rate: number;
}

export interface TaxPolicy {
  taxRate: number;
}

export interface ShippingPolicy {
  baseRate: number;
}

export interface BusinessConfigurationPort {
  getReturnPolicy(): Promise<ReturnPolicy>;
  getCommissionPolicy(): Promise<CommissionPolicy>;
  getTaxPolicy(): Promise<TaxPolicy>;
  getShippingPolicy(): Promise<ShippingPolicy>;
}
