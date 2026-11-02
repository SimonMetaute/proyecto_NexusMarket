/**
 * Application Service: AdministratorService
 * Implements AdministratorPort
 *
 * Operaciones de administración: usuarios, vendedores, productos, políticas,
 * devoluciones, dashboard y auditoría.
 */
import type {
  AdministratorPort,
  UserFilterCriteria,
  BuyerFilterCriteria,
  SellerFilterCriteria,
  ReturnFilterCriteria,
  DisputeFilterCriteria,
  AuditFilterCriteria,
  OperationFilterCriteria,
  DateRange,
  TaxPolicy,
  CommissionPolicy,
  ReturnPolicy,
  ShippingPolicy,
  KPIDefinition,
  Invoice,
  Settlement,
  Dispute,
  OperationalDashboard,
  AnomalyAlert,
  AuditReconciliationRequest,
} from '../../domain/ports/in/AdministratorPort.js';
import { User, UserType, IdentityDocument } from '../../domain/model/user.js';
import type { Buyer } from '../../domain/entities/Buyer.js';
import type { Seller } from '../../domain/entities/Seller.js';
import type { Product } from '../../domain/entities/Product.js';
import type { Payment } from '../../domain/entities/Payment.js';
import type { Return } from '../../domain/entities/Return.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { SellerRepositoryPort } from '../../domain/ports/out/SellerRepositoryPort.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import type { ReturnRepositoryPort } from '../../domain/ports/out/ReturnRepositoryPort.js';
import type { InvoiceRepositoryPort } from '../../domain/ports/out/InvoiceRepositoryPort.js';
import type { PaymentRepositoryPort } from '../../domain/ports/out/PaymentRepositoryPort.js';
import type { OperationRepositoryPort } from '../../domain/ports/out/OperationRepositoryPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import type { Operation } from '../../domain/ports/in/AdministratorPort.js';
import { SellerVerificationStatus } from '../../domain/model/enums.js';
import { ApiError } from '../../infrastructure/http/errors/ApiError.js';

export class AdministratorService implements AdministratorPort {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly sellerRepository: SellerRepositoryPort,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly returnRepository: ReturnRepositoryPort,
    private readonly invoiceRepository: InvoiceRepositoryPort,
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly operationRepository: OperationRepositoryPort,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  // --- User Management ---
  async registerEmployeeUser(user: User, newEmployee: User): Promise<User> {
    const existing = await this.userRepository.findByEmail(newEmployee.email);
    if (existing !== null) {
      throw ApiError.alreadyExists(`Email ${newEmployee.email} already registered`);
    }
    await this.userRepository.save(newEmployee);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'USER_REGISTERED',
        timestamp: new Date(),
        details: { employeeId: newEmployee.userId, role: newEmployee.userType },
      }),
    );
    return newEmployee;
  }

  async consultUsers(user: User, criteria: UserFilterCriteria): Promise<User[]> {
    // UserRepository has no findAll; return empty list for now.
    return [];
  }

  async consultUserDetails(user: User, targetUser: User): Promise<User> {
    const found = await this.userRepository.findById(targetUser.userId);
    if (!found) {
      throw ApiError.notFound(`User ${targetUser.userId} not found`);
    }
    return found;
  }

  async changeUserStatus(user: User, targetUser: User, newStatus: any): Promise<User> {
    const found = await this.userRepository.findById(targetUser.userId);
    if (!found) {
      throw ApiError.notFound(`User ${targetUser.userId} not found`);
    }
    const updated = new User({
      userId: found.userId,
      userType: found.userType as UserType,
      firstName: found.firstName,
      lastName: found.lastName,
      email: found.email,
      password: found.password,
      phone: found.phone,
      identityDocument: found.identityDocument,
      registrationDate: found.registrationDate,
      status: String(newStatus),
      updateDate: new Date(),
    } as any);
    await this.userRepository.save(updated);
    return updated;
  }

  async changeUserRole(user: User, targetUser: User, newRole: any): Promise<User> {
    return this.changeUserStatus(user, targetUser, newRole);
  }

  async suspendUserAccess(user: User, targetUser: User, reason: string): Promise<void> {
    await this.changeUserStatus(user, targetUser, 'Blocked');
  }

  async reactivateUserAccess(user: User, targetUser: User): Promise<void> {
    await this.changeUserStatus(user, targetUser, 'Active');
  }

  // --- Buyer Management & Trust ---
  async consultBuyers(user: User, criteria: BuyerFilterCriteria): Promise<Buyer[]> {
    return [];
  }

  async consultBuyerDetails(user: User, buyer: Buyer): Promise<Buyer> {
    const found = await this.buyerRepository.findByIdentifier(buyer);
    if (!found) {
      throw ApiError.notFound(`Buyer ${buyer.buyerId} not found`);
    }
    return found;
  }

  async changeCustomerStatus(user: User, buyer: Buyer, newStatus: any): Promise<Buyer> {
    return buyer;
  }

  async assessBuyerTrustProfile(user: User, buyer: Buyer): Promise<any> {
    return { trustLevel: buyer.trustLevel, score: 0 };
  }

  async restrictBuyerAccess(user: User, buyer: Buyer, reason: string): Promise<void> {}

  // --- Seller Verification & Compliance ---
  async consultPendingSellerVerifications(user: User): Promise<Seller[]> {
    return this.sellerRepository.findByVerificationStatus(SellerVerificationStatus.PENDING);
  }

  async consultAllSellers(user: User, criteria: SellerFilterCriteria): Promise<Seller[]> {
    if (criteria.verificationStatus) {
      return this.sellerRepository.findByVerificationStatus(criteria.verificationStatus as SellerVerificationStatus);
    }
    return [];
  }

  async consultSellerDetails(user: User, seller: Seller): Promise<Seller> {
    const found = await this.sellerRepository.findByIdentifier(seller);
    if (!found) {
      throw ApiError.notFound(`Seller ${seller.sellerId} not found`);
    }
    return found;
  }

  async approveSeller(user: User, seller: Seller): Promise<Seller> {
    seller.approve();
    await this.sellerRepository.save(seller);
    return seller;
  }

  async rejectSeller(user: User, seller: Seller, reason: string): Promise<Seller> {
    seller.reject();
    await this.sellerRepository.save(seller);
    return seller;
  }

  async revokeSellerAccess(user: User, seller: Seller, reason: string): Promise<Seller> {
    seller.reject();
    await this.sellerRepository.save(seller);
    return seller;
  }

  async changeSellerVerificationStatus(user: User, seller: Seller, newStatus: SellerVerificationStatus): Promise<Seller> {
    if (newStatus === SellerVerificationStatus.VERIFIED) seller.approve();
    else if (newStatus === SellerVerificationStatus.REJECTED) seller.reject();
    await this.sellerRepository.save(seller);
    return seller;
  }

  async reviewSellerCompliance(user: User, seller: Seller): Promise<any> {
    return { compliant: true, sellerId: seller.sellerId };
  }

  // --- Product Catalog Control ---
  async consultSuspendedProducts(user: User): Promise<Product[]> {
    return [];
  }

  async consultProductsForApproval(user: User): Promise<Product[]> {
    return [];
  }

  async approveProduct(user: User, product: Product): Promise<Product> {
    product.publish();
    await this.productRepository.save(product);
    return product;
  }

  async rejectProduct(user: User, product: Product, reason: string): Promise<Product> {
    product.deactivate();
    await this.productRepository.save(product);
    return product;
  }

  async suspendProduct(user: User, product: Product, reason: string): Promise<Product> {
    product.suspend();
    await this.productRepository.save(product);
    return product;
  }

  async reactivateProduct(user: User, product: Product): Promise<Product> {
    product.publish();
    await this.productRepository.save(product);
    return product;
  }

  // --- Marketplace Policies & Configuration ---
  async consultTaxPolicy(user: User): Promise<TaxPolicy> {
    return { taxRate: 0.19 };
  }

  async updateTaxPolicy(user: User, policy: TaxPolicy): Promise<TaxPolicy> {
    return policy;
  }

  async consultCommissionPolicy(user: User): Promise<CommissionPolicy> {
    return { rate: 0.05 };
  }

  async updateCommissionPolicy(user: User, policy: CommissionPolicy): Promise<CommissionPolicy> {
    return policy;
  }

  async consultReturnPolicy(user: User): Promise<ReturnPolicy> {
    return { returnWindowDays: 30 };
  }

  async updateReturnPolicy(user: User, policy: ReturnPolicy): Promise<ReturnPolicy> {
    return policy;
  }

  async consultShippingPolicy(user: User): Promise<ShippingPolicy> {
    return { baseRate: 5000 };
  }

  async updateShippingPolicy(user: User, policy: ShippingPolicy): Promise<ShippingPolicy> {
    return policy;
  }

  // --- KPI & Metrics Management ---
  async defineKPI(user: User, kpiDefinition: KPIDefinition): Promise<KPIDefinition> {
    return kpiDefinition;
  }

  async consultDefinedKPIs(user: User): Promise<KPIDefinition[]> {
    return [];
  }

  // --- Financial & Settlement Oversight ---
  async consultAllSettlements(user: User, period: DateRange): Promise<Settlement[]> {
    return [];
  }

  async consultSettlementDetails(user: User, settlement: Settlement): Promise<Settlement> {
    return settlement;
  }

  async reconcilePayment(user: User, payment: Payment): Promise<Payment> {
    return payment;
  }

  async consultInvoiceDetails(user: User, invoice: Invoice): Promise<Invoice> {
    const found = await this.invoiceRepository.findByIdentifier(invoice as any);
    if (!found) {
      throw ApiError.notFound(`Invoice ${invoice.invoiceId} not found`);
    }
    return found as unknown as Invoice;
  }

  // --- Returns & Disputes Management ---
  async consultAllReturns(user: User, criteria: ReturnFilterCriteria): Promise<Return[]> {
    return [];
  }

  async consultReturnDetails(user: User, returnCase: Return): Promise<Return> {
    const found = await this.returnRepository.findByIdentifier(returnCase);
    if (!found) {
      throw ApiError.notFound(`Return ${returnCase.returnId} not found`);
    }
    return found;
  }

  async approveReturn(user: User, returnCase: Return): Promise<Return> {
    returnCase.approve();
    return returnCase;
  }

  async rejectReturn(user: User, returnCase: Return, reason: string): Promise<Return> {
    returnCase.reject();
    return returnCase;
  }

  async consultAllDisputes(user: User, criteria: DisputeFilterCriteria): Promise<Dispute[]> {
    return [];
  }

  async resolveDispute(user: User, dispute: Dispute, resolution: string): Promise<Dispute> {
    return dispute;
  }

  // --- Operational Monitoring & Alerts ---
  async consultOperationalDashboard(user: User): Promise<OperationalDashboard> {
    return { activeOrders: 0, totalSales: 0 };
  }

  async consultActiveAnomalies(user: User): Promise<AnomalyAlert[]> {
    return [];
  }

  async investigateAnomaly(user: User, anomaly: AnomalyAlert): Promise<AnomalyAlert> {
    return anomaly;
  }

  // --- Audit & Compliance ---
  async consultAuditLogs(user: User, criteria: AuditFilterCriteria): Promise<AuditLog[]> {
    return [];
  }

  async consultAllOperations(user: User, criteria: OperationFilterCriteria): Promise<Operation[]> {
    return [];
  }

  async reconcileAuditRecords(user: User, request: AuditReconciliationRequest): Promise<void> {}
}
