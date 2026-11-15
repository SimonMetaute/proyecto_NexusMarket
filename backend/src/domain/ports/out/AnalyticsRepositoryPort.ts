/**
 * Outbound Port: AnalyticsRepositoryPort.
 *
 * Read-only projections used by the admin and seller dashboards. Kept separate
 * from the aggregate repositories so reporting queries never distort the
 * transactional write models.
 */

export interface AdminDashboardStats {
  activeOrders: number;
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  publishedProducts: number;
  pendingReturns: number;
}

export interface SellerDashboardStats {
  activeOrders: number;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  publishedProducts: number;
  totalStock: number;
  pendingReturns: number;
}

export interface SettlementPeriod {
  startDate: Date;
  endDate: Date;
}

/** Aggregates feeding the seller settlement report. */
export interface SellerSettlementStats {
  orderCount: number;
  deliveredOrders: number;
  /** Orders in the period, excluding cancelled/refunded ones. */
  grossSales: number;
  /** Orders actually delivered in the period. */
  deliveredSales: number;
  /** Refunds approved or completed in the period. */
  refundedAmount: number;
  pendingReturns: number;
}

export interface AnalyticsRepositoryPort {
  getAdminDashboard(): Promise<AdminDashboardStats>;
  getSellerDashboard(sellerId: string): Promise<SellerDashboardStats>;
  getSellerSettlement(
    sellerId: string,
    period: SettlementPeriod,
  ): Promise<SellerSettlementStats>;
}
