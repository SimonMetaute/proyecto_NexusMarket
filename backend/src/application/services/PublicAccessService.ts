/**
 * Application Service: PublicAccessService
 * Implements PublicAccessPort
 *
 * Flujos públicos (no requieren autenticación, salvo logout):
 *  - login (POST /auth/login)
 *  - logout (POST /auth/logout)
 *  - registerBuyer (POST /auth/register/buyer)
 *  - searchPublicCatalog / consultPublicProductDetails (GET /catalog/*)
 */
import type {
  PublicAccessPort,
  SearchCriteria,
} from '../../domain/ports/in/PublicAccessPort.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import type { PasswordServicePort } from '../../domain/ports/out/PasswordServicePort.js';
import type { JwtServicePort } from '../../domain/ports/out/JwtServicePort.js';
import { User, UserType, IdentityDocument } from '../../domain/model/user.js';
import { Buyer } from '../../domain/entities/Buyer.js';
import { Product } from '../../domain/entities/Product.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import { ApiError } from '../../infrastructure/http/errors/ApiError.js';

export class PublicAccessService implements PublicAccessPort {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly passwordService: PasswordServicePort,
    private readonly jwtService: JwtServicePort,
  ) {}

  async login(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw ApiError.invalidCredentials();
    }

    const matches = await this.passwordService.matches(password, user.password);
    if (!matches) {
      throw ApiError.invalidCredentials();
    }

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'USER_LOGIN',
        timestamp: new Date(),
        details: { email: user.email },
      }),
    );

    return user;
  }

  async logout(user: User): Promise<void> {
    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'USER_LOGOUT',
        timestamp: new Date(),
        details: { email: user.email },
      }),
    );
  }

  async registerBuyer(buyer: Buyer): Promise<User> {
    const email = buyer.userId;
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser !== null) {
      throw ApiError.alreadyExists(`Email ${email} is already registered`);
    }

    const userId = globalThis.crypto.randomUUID();
    const firstPart = email.split('@')[0] ?? email;
    const user = new User({
      userId,
      userType: UserType.Buyer,
      firstName: firstPart,
      lastName: firstPart,
      email,
      password: '',
      phone: '',
      identityDocument: new IdentityDocument('Citizenship Card', email),
      registrationDate: new Date(),
      status: 'Active',
      updateDate: new Date(),
    });

    await this.userRepository.save(user);
    await this.buyerRepository.save(buyer);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: userId,
        action: 'BUYER_REGISTRATION',
        timestamp: new Date(),
        details: { email },
      }),
    );

    return user;
  }

  async searchPublicCatalog(criteria: SearchCriteria): Promise<Product[]> {
    const products = await this.productRepository.findAll();
    return products.filter((p) => {
      if (criteria.category && p.category !== undefined && p.category !== criteria.category) {
        return false;
      }
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (criteria.minPrice !== undefined && p.price < criteria.minPrice) {
        return false;
      }
      if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) {
        return false;
      }
      return true;
    });
  }

  async consultPublicProductDetails(product: Product): Promise<Product> {
    const found = await this.productRepository.findById(product.productId);
    if (!found) {
      throw ApiError.notFound(`Product ${product.productId} not found`);
    }
    return found;
  }
}
