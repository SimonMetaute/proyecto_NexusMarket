/**
 * Domain Enums & Catalogs - NexusMarket
 * Source: SDD/Domain/domain_model.md (Sections 2, 4, 5)
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks, or infrastructure elements.
 *  - Only TypeScript language built-ins.
 */

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  LOGISTICS_OPERATOR = 'LOGISTICS_OPERATOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  SUPERVISOR = 'SUPERVISOR',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  BLOCKED = 'Blocked',
  PENDING_VERIFICATION = 'PendingVerification',
}

export enum PersonType {
  NATURAL = 'Natural',
  LEGAL = 'Legal',
}

export enum SellerVerificationStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
}

export enum StoreStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export enum StoreCategory {
  ELECTRONICS = 'Electronics',
  HOME = 'Home',
  CLOTHING_AND_ACCESSORIES = 'Clothing and Accessories',
  BEAUTY = 'Beauty',
  SPORTS = 'Sports',
  TOYS = 'Toys',
  OFFICE = 'Office',
  HARDWARE = 'Hardware',
  AUTOMOTIVE = 'Automotive',
  OTHER = 'Other',
}

export enum WarehouseStatus {
  OPERATIONAL = 'Operational',
  CLOSED = 'Closed',
  MAINTENANCE = 'Maintenance',
}

export enum ProductStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
  OUT_OF_STOCK = 'OutOfStock',
}

export enum ProductCategory {
  ELECTRONICS = 'Electronics',
  HOME = 'Home',
  CLOTHING_AND_ACCESSORIES = 'Clothing and Accessories',
  BEAUTY = 'Beauty',
  SPORTS = 'Sports',
  TOYS = 'Toys',
  OFFICE = 'Office',
  HARDWARE = 'Hardware',
  AUTOMOTIVE = 'Automotive',
  OTHER = 'Other',
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PREPARING = 'Preparing',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded',
  RETURN_REQUESTED = 'ReturnRequested',
  RETURNED = 'Returned',
}

export enum PaymentStatus {
  PENDING = 'Pending',
  AUTHORIZED = 'Authorized',
  REJECTED = 'Rejected',
  REFUNDED = 'Refunded',
  FAILED = 'Failed',
}

export enum ShipmentStatus {
  SCHEDULED = 'Scheduled',
  IN_PREPARATION = 'InPreparation',
  IN_TRANSIT = 'InTransit',
  DELIVERED = 'Delivered',
  FAILED = 'Failed',
  RETAINED = 'Retained',
}

export enum ReturnStatus {
  REQUESTED = 'Requested',
  IN_REVIEW = 'InReview',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed',
}

export enum ReturnReason {
  DAMAGE = 'Damage',
  SHIPPING_ERROR = 'Shipping Error',
  DISAGREEMENT = 'Disagreement',
  OTHER = 'Other',
}

export enum InvoiceStatus {
  ISSUED = 'Issued',
  PAID = 'Paid',
  CANCELLED = 'Cancelled',
}

export enum DocumentType {
  CITIZENSHIP_CARD = 'Citizenship Card',
  IDENTITY_CARD = 'Identity Card',
  TAX_ID = 'Tax ID',
  PASSPORT = 'Passport',
  FOREIGN_ID = 'Foreign ID',
}

export enum CurrencyCode {
  COP = 'COP',
  USD = 'USD',
  EUR = 'EUR',
}

export enum OperationType {
  BUYER_REGISTRATION = 'BUYER_REGISTRATION',
  SELLER_REGISTRATION = 'SELLER_REGISTRATION',
  SELLER_VERIFICATION = 'SELLER_VERIFICATION',
  USER_STATUS_CHANGE = 'USER_STATUS_CHANGE',
  PRODUCT_PUBLICATION = 'PRODUCT_PUBLICATION',
  PRODUCT_MODIFICATION = 'PRODUCT_MODIFICATION',
  PRODUCT_UNPUBLICATION = 'PRODUCT_UNPUBLICATION',
  PRODUCT_STATUS_CHANGE = 'PRODUCT_STATUS_CHANGE',
  INVENTORY_ENTRY = 'INVENTORY_ENTRY',
  INVENTORY_RESERVATION = 'INVENTORY_RESERVATION',
  INVENTORY_DEDUCTION = 'INVENTORY_DEDUCTION',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  CART_CREATION = 'CART_CREATION',
  CART_MODIFICATION = 'CART_MODIFICATION',
  CART_CANCELLATION = 'CART_CANCELLATION',
  ORDER_CREATION = 'ORDER_CREATION',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  PAYMENT_CREATION = 'PAYMENT_CREATION',
  PAYMENT_AUTHORIZATION = 'PAYMENT_AUTHORIZATION',
  PAYMENT_REJECTION = 'PAYMENT_REJECTION',
  PAYMENT_REFUND_REQUEST = 'PAYMENT_REFUND_REQUEST',
  REFUND_PROCESSING = 'REFUND_PROCESSING',
  SHIPMENT_DISPATCH = 'SHIPMENT_DISPATCH',
  SHIPMENT_STATUS_UPDATE = 'SHIPMENT_STATUS_UPDATE',
  SHIPMENT_DELIVERY = 'SHIPMENT_DELIVERY',
  SHIPMENT_FAILURE = 'SHIPMENT_FAILURE',
  RETURN_REQUEST = 'RETURN_REQUEST',
  RETURN_APPROVAL = 'RETURN_APPROVAL',
  RETURN_REJECTION = 'RETURN_REJECTION',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
}
