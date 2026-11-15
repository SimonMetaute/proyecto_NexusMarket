/**
 * Contrato real del backend NexusMarket (`/api/v1`).
 * Fuente: `docs/api-contract-summary.md` (auditoría Fase 1).
 * No inventar campos: todo lo declarado aquí existe en las respuestas reales.
 */

export type Role =
  | 'BUYER'
  | 'SELLER'
  | 'ADMINISTRATOR'
  | 'SUPERVISOR'
  | 'LOGISTICS_OPERATOR';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresIn: number;
}

export interface RegisterBuyerRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  identification: string;
}

export interface RegisterBuyerResponse {
  userId: string;
  email: string;
  role: string;
  status: string;
  message: string;
}

export interface ApiErrorDetails {
  field?: string;
  error?: string;
  [key: string]: unknown;
}

export interface ApiErrorEnvelope {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  requestId: string;
  details?: ApiErrorDetails;
}

/* ---------------------------------- Catálogo --------------------------------- */

export interface CatalogSellerRef {
  sellerId: string;
}

export interface CatalogProduct {
  productId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  seller: CatalogSellerRef;
  brand?: string;
  sku?: string;
  productStatus: string;
  stock: number;
  publicationDate?: string;
  createdAt?: string;
}

export interface CatalogPage {
  total: number;
  page: number;
  limit: number;
  products: CatalogProduct[];
}

export interface CatalogQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

/* ---------------------------------- Comprador -------------------------------- */

export interface DeliveryAddress {
  addressId: string;
  country: string;
  department: string;
  city: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  reference?: string;
  isPrimary: boolean;
}

export interface PaymentMethod {
  paymentMethodId: string;
  type: string;
  maskedNumber: string;
  cardholder: string;
  expirationDate: string;
  brand: string;
  isDefault: boolean;
}

export interface BuyerProfile {
  buyerId: string;
  userId: string;
  trustLevel: string;
  lastPurchaseDate?: string;
  deliveryAddresses: DeliveryAddress[];
  paymentMethods: PaymentMethod[];
}

export interface UpdateBuyerProfileRequest {
  trustLevel?: string;
  lastPurchaseDate?: string;
}

export interface CartLine {
  cartLineId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  cartId: string;
  buyerId: string;
  status: string;
  subtotal: number;
  total: number;
  updateDate?: string;
  cartLines: CartLine[];
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface AddCartItemResponse {
  cartId: string;
  cartLines?: CartLine[];
  subtotal?: number;
  total?: number;
}

export interface CheckoutRequest {
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
}

export interface OrderSummary {
  orderId: string;
  buyerId: string;
  sellerId?: string;
  total: number;
  orderStatus: string;
  creationDate: string;
}

export interface OrderLine {
  lineId: string;
  product: { productId: string };
  variantId?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderDetail {
  orderId: string;
  total: number;
  status?: string;
  orderStatus: string;
  items: OrderLine[];
}

/* ---------------------------------- Vendedor --------------------------------- */

export interface SellerProfile {
  sellerId: string;
  userId: string;
  commercialName: string;
  personType: string;
  verificationStatus: string;
  reputation: number;
  approvalDate?: string;
}

export interface SellerWarehouse {
  warehouseId: string;
  sellerId: string;
  name: string;
  location: {
    country: string;
    department: string;
    city: string;
    address: string;
    postalCode: string;
    coordinates?: string;
  };
  capacity: number;
  status: string;
  creationDate: string;
}

export interface CreateWarehouseRequest {
  warehouseId: string;
  name: string;
  country: string;
  department: string;
  city: string;
  address: string;
  postalCode: string;
  capacity: number;
  status: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  brand?: string;
  category?: string;
  productStatus?: string;
  basePrice?: number;
}

export interface CreateProductResponse {
  productId: string;
  name: string;
  status: string;
  sku?: string;
  price: number;
}

export interface PublishProductResponse {
  productId: string;
  status: string;
  message: string;
}

export interface CreateVariantRequest {
  variantId: string;
  attribute: string;
  value: string;
  additionalPrice: number;
  skuVariant: string;
}

export interface CreateVariantResponse {
  variantId: string;
  attribute: string;
  value: string;
  skuVariant: string;
}

export interface InventoryItem {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  availableStock: number;
  reservedStock: number;
  totalStock: number;
  updateDate: string;
}

export interface StockEntryRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  receiptReference: string;
}

export interface StockEntryResponse {
  inventoryId: string;
  availableStock: number;
  totalStock: number;
}

export interface SellerOrder {
  orderId: string;
  buyerId: string;
  total: number;
  orderStatus: string;
  creationDate: string;
}

export interface OrderStatusActionResponse {
  orderId: string;
  orderStatus: string;
}

/* ------------------------------ Administración ------------------------------ */

export interface DashboardSummary {
  activeOrders: number;
  totalSales: number;
}

export interface HealthSummary {
  status: string;
  uptime: number;
}

export interface SellerApprovalResponse {
  sellerId: string;
  verificationStatus: string;
}

export interface AdminUser {
  userId: string;
  email: string;
  role: string;
  username?: string;
  status?: string;
}

export interface CreateUserRequest {
  userType: 'Buyer' | 'Seller' | 'Administrator';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  identityDocumentType: string;
  identityDocumentNumber: string;
  status?: string;
}

export interface UserResponse {
  userId: string;
  userType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityDocument: { type: string; number: string };
  registrationDate?: string;
  status: string;
  updateDate?: string;
}

/* --------------------------------- Logística -------------------------------- */

export interface LogisticsWarehouse extends SellerWarehouse {}

export interface ShipmentActionResponse {
  shipmentId: string;
  shipmentStatus: string;
}

/* ---------------------------------- Errores --------------------------------- */

export interface FieldErrors {
  [field: string]: string;
}

export type PaymentOutcome = 'approved' | 'rejected' | 'unknown';
