/**
 * Input Port: AdministratorPort
 * Source: SDD/Domain/input-ports.md (Section 3.5)
 * Aligned: changeSellerVerificationStatus documented per Contract-alignment.
 */

import type { User } from '../../model/user.js';
import type { Buyer } from '../../entities/Buyer.js';
import type { Seller } from '../../entities/Seller.js';
import type { Product } from '../../entities/Product.js';
import type { Order } from '../../entities/Order.js';
import type { Payment } from '../../entities/Payment.js';
import type { Return } from '../../entities/Return.js';
import type { Shipment } from '../../entities/Shipment.js';
import type { AuditLog } from '../../domain/model/AuditLog.js';
import { SellerVerificationStatus } from '../../model/enums.js';

export interface UserFilterCriteria {
  role?: string;
  status?: string;
}

export interface BuyerFilterCriteria {
  trustLevel?: string;
  status?: string;
}

export interface SellerFilterCriteria {
  verificationStatus?: string;
}

export interface ReturnFilterCriteria {
  status?: string;
}

export interface DisputeFilterCriteria {
  status?: string;
}

export interface AuditFilterCriteria {
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export interface OperationFilterCriteria {
  operationType?: string;
  from?: Date;
  to?: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TaxPolicy {
  taxRate: number;
}

export interface CommissionPolicy {
  rate: number;
}

export interface ReturnPolicy {
  returnWindowDays: number;
}

export interface ShippingPolicy {
  baseRate: number;
}

export interface KPIDefinition {
  kpiId: string;
  name: string;
  formula: string;
}

export interface Invoice {
  invoiceId: string;
}

export interface Settlement {
  settlementId: string;
}

export interface Dispute {
  disputeId: string;
}

export interface OperationalDashboard {
  activeOrders: number;
  totalSales: number;
}

export interface AnomalyAlert {
  alertId: string;
  severity: string;
}

export interface AuditReconciliationRequest {
  from: Date;
  to: Date;
}

export interface Operation {
  operationId: string;
}

export interface AdministratorPort {
  // User Management
  registerEmployeeUser(user: User, newEmployee: User): Promise<User>;
  consultUsers(user: User, criteria: UserFilterCriteria): Promise<User[]>;
  consultUserDetails(user: User, targetUser: User): Promise<User>;
  changeUserStatus(user: User, targetUser: User, newStatus: any): Promise<User>;
  changeUserRole(user: User, targetUser: User, newRole: any): Promise<User>;
  suspendUserAccess(user: User, targetUser: User, reason: string): Promise<void>;
  reactivateUserAccess(user: User, targetUser: User): Promise<void>;

  // Buyer Management & Trust
  consultBuyers(user: User, criteria: BuyerFilterCriteria): Promise<Buyer[]>;
  consultBuyerDetails(user: User, buyer: Buyer): Promise<Buyer>;
  changeCustomerStatus(user: User, buyer: Buyer, newStatus: any): Promise<Buyer>;
  assessBuyerTrustProfile(user: User, buyer: Buyer): Promise<any>;
  restrictBuyerAccess(user: User, buyer: Buyer, reason: string): Promise<void>;

  // Seller Verification & Compliance
  consultPendingSellerVerifications(user: User): Promise<Seller[]>;
  consultAllSellers(user: User, criteria: SellerFilterCriteria): Promise<Seller[]>;
  consultSellerDetails(user: User, seller: Seller): Promise<Seller>;
  approveSeller(user: User, seller: Seller): Promise<Seller>;
  rejectSeller(user: User, seller: Seller, reason: string): Promise<Seller>;
  revokeSellerAccess(user: User, seller: Seller, reason: string): Promise<Seller>;
  changeSellerVerificationStatus(user: User, seller: Seller, newStatus: SellerVerificationStatus): Promise<Seller>;
  reviewSellerCompliance(user: User, seller: Seller): Promise<any>;

  // Product Catalog Control
  consultSuspendedProducts(user: User): Promise<Product[]>;
  consultProductsForApproval(user: User): Promise<Product[]>;
  approveProduct(user: User, product: Product): Promise<Product>;
  rejectProduct(user: User, product: Product, reason: string): Promise<Product>;
  suspendProduct(user: User, product: Product, reason: string): Promise<Product>;
  reactivateProduct(user: User, product: Product): Promise<Product>;

  // Marketplace Policies & Configuration
  consultTaxPolicy(user: User): Promise<TaxPolicy>;
  updateTaxPolicy(user: User, policy: TaxPolicy): Promise<TaxPolicy>;
  consultCommissionPolicy(user: User): Promise<CommissionPolicy>;
  updateCommissionPolicy(user: User, policy: CommissionPolicy): Promise<CommissionPolicy>;
  consultReturnPolicy(user: User): Promise<ReturnPolicy>;
  updateReturnPolicy(user: User, policy: ReturnPolicy): Promise<ReturnPolicy>;
  consultShippingPolicy(user: User): Promise<ShippingPolicy>;
  updateShippingPolicy(user: User, policy: ShippingPolicy): Promise<ShippingPolicy>;

  // KPI & Metrics Management
  defineKPI(user: User, kpiDefinition: KPIDefinition): Promise<KPIDefinition>;
  consultDefinedKPIs(user: User): Promise<KPIDefinition[]>;

  // Financial & Settlement Oversight
  consultAllSettlements(user: User, period: DateRange): Promise<Settlement[]>;
  consultSettlementDetails(user: User, settlement: Settlement): Promise<Settlement>;
  reconcilePayment(user: User, payment: Payment): Promise<Payment>;
  consultInvoiceDetails(user: User, invoice: Invoice): Promise<Invoice>;

  // Returns & Disputes Management
  consultAllReturns(user: User, criteria: ReturnFilterCriteria): Promise<Return[]>;
  consultReturnDetails(user: User, returnCase: Return): Promise<Return>;
  approveReturn(user: User, returnCase: Return): Promise<Return>;
  rejectReturn(user: User, returnCase: Return, reason: string): Promise<Return>;
  consultAllDisputes(user: User, criteria: DisputeFilterCriteria): Promise<Dispute[]>;
  resolveDispute(user: User, dispute: Dispute, resolution: string): Promise<Dispute>;

  // Operational Monitoring & Alerts
  consultOperationalDashboard(user: User): Promise<OperationalDashboard>;
  consultActiveAnomalies(user: User): Promise<AnomalyAlert[]>;
  investigateAnomaly(user: User, anomaly: AnomalyAlert): Promise<AnomalyAlert>;

  // Audit & Compliance
  consultAuditLogs(user: User, criteria: AuditFilterCriteria): Promise<AuditLog[]>;
  consultAllOperations(user: User, criteria: OperationFilterCriteria): Promise<Operation[]>;
  reconcileAuditRecords(user: User, request: AuditReconciliationRequest): Promise<void>;
}
