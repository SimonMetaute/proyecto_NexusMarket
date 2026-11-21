import { http } from './client';
import type {
  AddCartItemRequest,
  AddCartItemResponse,
  AddProductImageRequest,
  AdminDashboardSummary,
  AdminUser,
  AdminUserFilters,
  AuditLogPage,
  AuditLogQuery,
  BuyerProfile,
  Cart,
  CatalogPage,
  CatalogProduct,
  CatalogQuery,
  CheckoutRequest,
  CreateProductRequest,
  CreateProductResponse,
  CreateUserRequest,
  CreateVariantRequest,
  CreateVariantResponse,
  CreateWarehouseRequest,
  DashboardSummary,
  DeliveryAddress,
  HealthSummary,
  InventoryItem,
  LoginRequest,
  LoginResponse,
  OnboardSellerRequest,
  OnboardSellerResponse,
  OrderDetail,
  OrderStatusActionResponse,
  OrderSummary,
  PaymentMethod,
  ProductImage,
  PublishProductResponse,
  RegisterBuyerRequest,
  RegisterBuyerResponse,
  RequestReturnRequest,
  ReturnCase,
  ReturnFilters,
  SellerApprovalResponse,
  SellerDashboard,
  SellerOrder,
  SellerProduct,
  SellerProfile,
  SellerWarehouse,
  Shipment,
  ShipmentActionResponse,
  ShipmentFilters,
  StockEntryRequest,
  StockEntryResponse,
  UpdateBuyerProfileRequest,
  UpdateProductRequest,
  UserResponse,
} from './types';

/* ---------------------------------- Auth ----------------------------------- */

export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function registerBuyer(
  payload: RegisterBuyerRequest,
): Promise<RegisterBuyerResponse> {
  const { data } = await http.post<RegisterBuyerResponse>(
    '/auth/register/buyer',
    payload,
  );
  return data;
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

/* --------------------------------- Catálogo -------------------------------- */

export async function searchCatalog(
  query: CatalogQuery = {},
): Promise<CatalogPage> {
  const { data } = await http.get<CatalogPage>('/catalog/products', {
    params: query,
  });
  return data;
}

export async function getProduct(productId: string): Promise<CatalogProduct> {
  const { data } = await http.get<CatalogProduct>(
    `/catalog/products/${encodeURIComponent(productId)}`,
  );
  return data;
}

/* --------------------------------- Comprador ------------------------------- */

export async function getBuyerProfile(): Promise<BuyerProfile> {
  const { data } = await http.get<BuyerProfile>('/buyer/profile');
  return data;
}

export async function updateBuyerProfile(
  payload: UpdateBuyerProfileRequest,
): Promise<Pick<BuyerProfile, 'buyerId' | 'userId' | 'trustLevel'>> {
  const { data } = await http.put('/buyer/profile', payload);
  return data;
}

export async function listAddresses(): Promise<DeliveryAddress[]> {
  const { data } = await http.get<DeliveryAddress[]>('/buyer/addresses');
  return data;
}

export async function createAddress(
  payload: DeliveryAddress,
): Promise<DeliveryAddress> {
  const { data } = await http.post<DeliveryAddress>(
    '/buyer/addresses',
    payload,
  );
  return data;
}

export async function setPrimaryAddress(
  addressId: string,
): Promise<DeliveryAddress> {
  const { data } = await http.put<DeliveryAddress>(
    `/buyer/addresses/${encodeURIComponent(addressId)}/primary`,
  );
  return data;
}

export async function deleteAddress(addressId: string): Promise<void> {
  await http.delete(`/buyer/addresses/${encodeURIComponent(addressId)}`);
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await http.get<PaymentMethod[]>('/buyer/payment-methods');
  return data;
}

export async function createPaymentMethod(
  payload: PaymentMethod,
): Promise<PaymentMethod> {
  const { data } = await http.post<PaymentMethod>(
    '/buyer/payment-methods',
    payload,
  );
  return data;
}

export async function createCart(): Promise<Cart> {
  const { data } = await http.post<Cart>('/buyer/cart');
  return data;
}

export async function getCart(): Promise<Cart> {
  const { data } = await http.get<Cart>('/buyer/cart');
  return data;
}

export async function addCartItem(
  payload: AddCartItemRequest,
): Promise<AddCartItemResponse> {
  const { data } = await http.post<AddCartItemResponse>(
    '/buyer/cart/items',
    payload,
  );
  return data;
}

export async function updateCartItem(
  cartLineId: string,
  quantity: number,
): Promise<AddCartItemResponse> {
  const { data } = await http.put<AddCartItemResponse>(
    `/buyer/cart/items/${encodeURIComponent(cartLineId)}`,
    { quantity },
  );
  return data;
}

export async function removeCartItem(cartLineId: string): Promise<void> {
  await http.delete(`/buyer/cart/items/${encodeURIComponent(cartLineId)}`);
}

export async function clearCart(): Promise<void> {
  await http.delete('/buyer/cart');
}

export async function checkout(
  payload: CheckoutRequest,
): Promise<OrderSummary> {
  const { data } = await http.post<OrderSummary>('/buyer/checkout', payload);
  return data;
}

export async function listBuyerOrders(): Promise<OrderSummary[]> {
  const { data } = await http.get<OrderSummary[]>('/buyer/orders');
  return data;
}

export async function getBuyerOrder(orderId: string): Promise<OrderDetail> {
  const { data } = await http.get<OrderDetail>(
    `/buyer/orders/${encodeURIComponent(orderId)}`,
  );
  return data;
}

export async function requestReturn(
  orderId: string,
  payload: RequestReturnRequest,
): Promise<ReturnCase> {
  const { data } = await http.post<ReturnCase>(
    `/buyer/orders/${encodeURIComponent(orderId)}/returns`,
    payload,
  );
  return data;
}

export async function listBuyerReturns(): Promise<ReturnCase[]> {
  const { data } = await http.get<ReturnCase[]>('/buyer/returns');
  return data;
}

/* --------------------------------- Vendedor -------------------------------- */

export async function getSellerProfile(): Promise<SellerProfile> {
  const { data } = await http.get<SellerProfile>('/seller/profile');
  return data;
}

export async function updateSellerProfile(
  payload: { commercialName?: string },
): Promise<Pick<SellerProfile, 'sellerId' | 'commercialName' | 'verificationStatus'>> {
  const { data } = await http.put('/seller/profile', payload);
  return data;
}

export async function listSellerWarehouses(): Promise<SellerWarehouse[]> {
  const { data } = await http.get<SellerWarehouse[]>('/seller/warehouses');
  return data;
}

export async function createWarehouse(
  payload: CreateWarehouseRequest,
): Promise<Pick<SellerWarehouse, 'warehouseId' | 'name' | 'status'>> {
  const { data } = await http.post('/seller/warehouses', payload);
  return data;
}

export async function createProduct(
  payload: CreateProductRequest,
): Promise<CreateProductResponse> {
  const { data } = await http.post<CreateProductResponse>(
    '/seller/products',
    payload,
  );
  return data;
}

export async function listSellerProducts(): Promise<SellerProduct[]> {
  const { data } = await http.get<SellerProduct[]>('/seller/products');
  return data;
}

export async function updateSellerProduct(
  productId: string,
  payload: UpdateProductRequest,
): Promise<SellerProduct> {
  const { data } = await http.put<SellerProduct>(
    `/seller/products/${encodeURIComponent(productId)}`,
    payload,
  );
  return data;
}

export async function listProductImages(
  productId: string,
): Promise<ProductImage[]> {
  const { data } = await http.get<ProductImage[]>(
    `/seller/products/${encodeURIComponent(productId)}/images`,
  );
  return data;
}

export async function addProductImage(
  productId: string,
  payload: AddProductImageRequest,
): Promise<ProductImage> {
  const { data } = await http.post<ProductImage>(
    `/seller/products/${encodeURIComponent(productId)}/images`,
    payload,
  );
  return data;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  await http.delete(
    `/seller/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
  );
}

export async function getSellerDashboard(): Promise<SellerDashboard> {
  const { data } = await http.get<SellerDashboard>('/seller/dashboard');
  return data;
}

export async function publishProduct(
  productId: string,
): Promise<PublishProductResponse> {
  const { data } = await http.post<PublishProductResponse>(
    `/seller/products/${encodeURIComponent(productId)}/publish`,
  );
  return data;
}

export async function createVariant(
  productId: string,
  payload: CreateVariantRequest,
): Promise<CreateVariantResponse> {
  const { data } = await http.post<CreateVariantResponse>(
    `/seller/products/${encodeURIComponent(productId)}/variants`,
    payload,
  );
  return data;
}

export async function listSellerInventory(): Promise<InventoryItem[]> {
  const { data } = await http.get<InventoryItem[]>('/seller/inventory');
  return data;
}

export async function registerStockEntry(
  payload: StockEntryRequest,
): Promise<StockEntryResponse> {
  const { data } = await http.post<StockEntryResponse>(
    '/seller/inventory/stock-entry',
    payload,
  );
  return data;
}

export async function listSellerOrders(): Promise<SellerOrder[]> {
  const { data } = await http.get<SellerOrder[]>('/seller/orders');
  return data;
}

export async function approveOrder(
  orderId: string,
): Promise<OrderStatusActionResponse> {
  const { data } = await http.post<OrderStatusActionResponse>(
    `/seller/orders/${encodeURIComponent(orderId)}/approve`,
  );
  return data;
}

export async function prepareOrder(
  orderId: string,
): Promise<OrderStatusActionResponse> {
  const { data } = await http.post<OrderStatusActionResponse>(
    `/seller/orders/${encodeURIComponent(orderId)}/prepare`,
  );
  return data;
}

/* ------------------------------- Administración ----------------------------- */

export async function listAdminUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUser[]> {
  const { data } = await http.get<AdminUser[]>('/admin/users', {
    params: filters,
  });
  return data;
}

export async function changeUserStatus(
  userId: string,
  status: 'Active' | 'Inactive' | 'Blocked',
  reason?: string,
): Promise<{ userId: string; status: string }> {
  const { data } = await http.patch<{ userId: string; status: string }>(
    `/admin/users/${encodeURIComponent(userId)}/status`,
    { status, ...(reason !== undefined ? { reason } : {}) },
  );
  return data;
}

export async function onboardSeller(
  payload: OnboardSellerRequest,
): Promise<OnboardSellerResponse> {
  const { data } = await http.post<OnboardSellerResponse>(
    '/admin/sellers/onboarding',
    payload,
  );
  return data;
}

export async function listAuditLogs(
  query: AuditLogQuery = {},
): Promise<AuditLogPage> {
  const { data } = await http.get<AuditLogPage>('/admin/audit-logs', {
    params: query,
  });
  return data;
}

export async function createUser(
  payload: CreateUserRequest,
): Promise<UserResponse> {
  const { data } = await http.post<UserResponse>('/users', payload);
  return data;
}

export async function approveSeller(
  sellerId: string,
): Promise<SellerApprovalResponse> {
  const { data } = await http.post<SellerApprovalResponse>(
    `/admin/sellers/${encodeURIComponent(sellerId)}/approve`,
  );
  return data;
}

export async function rejectSeller(
  sellerId: string,
  reason: string,
): Promise<SellerApprovalResponse> {
  const { data } = await http.post<SellerApprovalResponse>(
    `/admin/sellers/${encodeURIComponent(sellerId)}/reject`,
    { reason },
  );
  return data;
}

export async function getAdminDashboard(): Promise<AdminDashboardSummary> {
  const { data } = await http.get<AdminDashboardSummary>('/admin/dashboard');
  return data;
}

export async function getSupervisorDashboard(): Promise<DashboardSummary> {
  const { data } = await http.get<DashboardSummary>('/supervisor/dashboard');
  return data;
}

export async function getSupervisorHealth(): Promise<HealthSummary> {
  const { data } = await http.get<HealthSummary>('/supervisor/health');
  return data;
}

/* --------------------------------- Logística -------------------------------- */

export async function listLogisticsWarehouses(): Promise<SellerWarehouse[]> {
  const { data } = await http.get<SellerWarehouse[]>('/logistics/warehouses');
  return data;
}

export async function listLogisticsShipments(
  filters: ShipmentFilters = {},
): Promise<Shipment[]> {
  const { data } = await http.get<Shipment[]>('/logistics/shipments', {
    params: filters,
  });
  return data;
}

export async function listLogisticsReturns(
  filters: ReturnFilters = {},
): Promise<ReturnCase[]> {
  const { data } = await http.get<ReturnCase[]>('/logistics/returns', {
    params: filters,
  });
  return data;
}

export async function receiveReturn(returnId: string): Promise<ReturnCase> {
  const { data } = await http.patch<ReturnCase>(
    `/logistics/returns/${encodeURIComponent(returnId)}/receive`,
  );
  return data;
}

export async function logisticsStockEntry(
  payload: StockEntryRequest,
): Promise<StockEntryResponse> {
  const { data } = await http.post<StockEntryResponse>(
    '/logistics/inventory/stock-entry',
    payload,
  );
  return data;
}

export async function dispatchShipment(
  shipmentId: string,
): Promise<ShipmentActionResponse> {
  const { data } = await http.post<ShipmentActionResponse>(
    `/logistics/shipments/${encodeURIComponent(shipmentId)}/dispatch`,
  );
  return data;
}

export async function confirmDelivery(
  shipmentId: string,
): Promise<ShipmentActionResponse> {
  const { data } = await http.post<ShipmentActionResponse>(
    `/logistics/shipments/${encodeURIComponent(shipmentId)}/confirm-delivery`,
  );
  return data;
}
