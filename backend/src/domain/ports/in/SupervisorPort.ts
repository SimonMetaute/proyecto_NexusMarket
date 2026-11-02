/**
 * Input Port: SupervisorPort
 * Source: SDD/Domain/input-ports.md (Section 3.6)
 */

import type { User } from '../../model/user.js';
import type { Order } from '../../entities/Order.js';
import type { Payment } from '../../entities/Payment.js';
import type { Shipment } from '../../entities/Shipment.js';
import type { Return } from '../../entities/Return.js';
import type { Buyer } from '../../entities/Buyer.js';
import type { AuditLog } from '../../domain/model/AuditLog.js';
import type { SellerPerformanceMetrics } from './SellerPort.js';

export interface DateRange {
  startDate: Date;
  endDate: Date;
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

export interface OperationalDashboard {
  activeOrders: number;
  totalSales: number;
}

export interface KPIMetric {
  kpiId: string;
  name: string;
  value: number;
}

export interface AnomalyAlert {
  alertId: string;
  severity: string;
}

export interface MarketplaceHealthStatus {
  status: string;
  uptime: number;
}

export interface ShipmentStatusUpdate {
  status: string;
  date: Date;
  description: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
}

export interface Dispute {
  disputeId: string;
}

export interface BuyerRiskScore {
  score: number;
  level: string;
}

export interface ReportType {
  type: string;
}

export interface AdministrativeReport {
  reportId: string;
  content: any;
}

export interface AdminAlert {
  alertId: string;
  message: string;
}

export interface Operation {
  operationId: string;
}

export interface SupervisorPort {
  // Dashboard & Monitoring
  consultOperationalDashboard(user: User): Promise<OperationalDashboard>;
  consultKPIMetrics(user: User, period: DateRange): Promise<KPIMetric[]>;
  consultActiveAnomalies(user: User): Promise<AnomalyAlert[]>;
  consultMarketplaceHealth(user: User): Promise<MarketplaceHealthStatus>;

  // Order Monitoring
  consultOrdersByStatus(user: User, status: any): Promise<Order[]>;
  consultOrderDetails(user: User, order: Order): Promise<Order>;
  consultOrderTimeline(user: User, order: Order): Promise<Operation[]>;

  // Payment & Financial Monitoring
  consultPaymentsByStatus(user: User, status: any): Promise<Payment[]>;
  consultPaymentDetails(user: User, payment: Payment): Promise<Payment>;
  consultFinancialSummary(user: User, period: DateRange): Promise<FinancialSummary>;

  // Shipment Tracking
  consultShipmentsByStatus(user: User, status: any): Promise<Shipment[]>;
  consultShipmentDetails(user: User, shipment: Shipment): Promise<Shipment>;
  consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]>;

  // Return & Dispute Monitoring
  consultReturnsByStatus(user: User, status: any): Promise<Return[]>;
  consultReturnDetails(user: User, returnCase: Return): Promise<Return>;
  consultDisputes(user: User): Promise<Dispute[]>;

  // Seller Performance Review
  consultSellerPerformance(user: User): Promise<SellerPerformanceMetrics[]>;
  consultSellerPerformanceDetails(user: User, seller: any): Promise<SellerPerformanceMetrics>;

  // Buyer Risk Assessment
  assessBuyerRisk(user: User, buyer: Buyer): Promise<BuyerRiskScore>;
  consultHighRiskBuyers(user: User): Promise<BuyerRiskScore[]>;

  // Audit Trail Review (Read-Only)
  consultAuditLogs(user: User, criteria: AuditFilterCriteria): Promise<AuditLog[]>;
  consultOperations(user: User, criteria: OperationFilterCriteria): Promise<Operation[]>;

  // Report Access
  generateReport(user: User, reportType: ReportType, period: DateRange): Promise<AdministrativeReport>;
  consultAdministrativeAlerts(user: User): Promise<AdminAlert[]>;
}
