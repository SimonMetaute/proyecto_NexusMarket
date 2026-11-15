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

export interface AnalyticsRepositoryPort {
  getAdminDashboard(): Promise<AdminDashboardStats>;
  getSellerDashboard(sellerId: string): Promise<SellerDashboardStats>;
}
