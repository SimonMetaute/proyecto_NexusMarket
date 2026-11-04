import express from 'express';
import { appConfig } from './infrastructure/config/appConfig.js';
import { initDb } from './infrastructure/database/init-db.js';
import { initMongo } from './infrastructure/database/mongo-connection.js';
import { pool } from './infrastructure/database/mysql-pool.js';

// --- Outbound adapters (repositories) -------------------------------------
import { MySQLUserRepository } from './infrastructure/repositories/MySQLUserRepository.js';
import { MySQLProductRepository } from './infrastructure/repositories/MySQLProductRepository.js';
import { MySQLProductVariantRepository } from './infrastructure/repositories/MySQLProductVariantRepository.js';
import { MySQLBuyerRepository } from './infrastructure/repositories/MySQLBuyerRepository.js';
import { MySQLSellerRepository } from './infrastructure/repositories/MySQLSellerRepository.js';
import { MySQLWarehouseRepository } from './infrastructure/repositories/MySQLWarehouseRepository.js';
import { MySQLInventoryRepository } from './infrastructure/repositories/MySQLInventoryRepository.js';
import { MySQLShoppingCartRepository } from './infrastructure/repositories/MySQLShoppingCartRepository.js';
import { MySQLOrderRepository } from './infrastructure/repositories/MySQLOrderRepository.js';
import { MySQLInvoiceRepository } from './infrastructure/repositories/MySQLInvoiceRepository.js';
import { MySQLPaymentRepository } from './infrastructure/repositories/MySQLPaymentRepository.js';
import { MySQLShipmentRepository } from './infrastructure/repositories/MySQLShipmentRepository.js';
import { MySQLReturnRepository } from './infrastructure/repositories/MySQLReturnRepository.js';
import { MySQLOperationRepository } from './infrastructure/repositories/MySQLOperationRepository.js';
import { MongoAuditLogRepository } from './infrastructure/repositories/MongoAuditLogRepository.js';

// --- Security adapters ----------------------------------------------------
import { BcryptPasswordService } from './infrastructure/security/BcryptPasswordService.js';
import { JwtTokenService } from './infrastructure/security/JwtTokenService.js';

// --- Application use cases ------------------------------------------------
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase.js';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase.js';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase.js';
import { LoginUseCase } from './application/use-cases/LoginUseCase.js';

// --- Application services (input port implementations) -------------------
import { PublicAccessService } from './application/services/PublicAccessService.js';
import { BuyerService } from './application/services/BuyerService.js';
import { SellerService } from './application/services/SellerService.js';
import { LogisticsOperatorService } from './application/services/LogisticsOperatorService.js';
import { AdministratorService } from './application/services/AdministratorService.js';
import { SupervisorService } from './application/services/SupervisorService.js';

// --- HTTP controllers -----------------------------------------------------
import { UserController } from './infrastructure/http/controllers/UserController.js';
import { ProductController } from './infrastructure/http/controllers/ProductController.js';
import { AuthController } from './infrastructure/http/controllers/AuthController.js';
import { CatalogController } from './infrastructure/http/controllers/CatalogController.js';
import { BuyerController } from './infrastructure/http/controllers/BuyerController.js';
import { SellerController } from './infrastructure/http/controllers/SellerController.js';
import { LogisticsController } from './infrastructure/http/controllers/LogisticsController.js';
import { AdministratorController } from './infrastructure/http/controllers/AdministratorController.js';
import { SupervisorController } from './infrastructure/http/controllers/SupervisorController.js';

// --- HTTP routes ----------------------------------------------------------
import { createAuthRoutes } from './infrastructure/http/routes/authRoutes.js';
import { createUserRoutes } from './infrastructure/http/routes/userRoutes.js';
import { createProductRoutes } from './infrastructure/http/routes/productRoutes.js';
import { createCatalogRoutes } from './infrastructure/http/routes/catalogRoutes.js';
import { createBuyerRoutes } from './infrastructure/http/routes/buyerRoutes.js';
import { createSellerRoutes } from './infrastructure/http/routes/sellerRoutes.js';
import { createLogisticsRoutes } from './infrastructure/http/routes/logisticsRoutes.js';
import { createAdminRoutes } from './infrastructure/http/routes/adminRoutes.js';
import { createSupervisorRoutes } from './infrastructure/http/routes/supervisorRoutes.js';

// --- HTTP middlewares -----------------------------------------------------
import { requestIdMiddleware } from './infrastructure/http/middlewares/requestId.js';
import { corsMiddleware } from './infrastructure/http/middlewares/cors.js';
import { createAuthMiddleware } from './infrastructure/http/middlewares/auth.js';
import { errorHandler, notFoundHandler } from './infrastructure/http/errors/errorHandler.js';

const app = express();

// Cross-cutting middleware (order matters).
app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

// --- Outbound adapters -----------------------------------------------------
const userRepository = new MySQLUserRepository();
const productRepository = new MySQLProductRepository();
const productVariantRepository = new MySQLProductVariantRepository();
const buyerRepository = new MySQLBuyerRepository();
const sellerRepository = new MySQLSellerRepository();
const warehouseRepository = new MySQLWarehouseRepository();
const inventoryRepository = new MySQLInventoryRepository();
const cartRepository = new MySQLShoppingCartRepository();
const orderRepository = new MySQLOrderRepository();
const invoiceRepository = new MySQLInvoiceRepository();
const paymentRepository = new MySQLPaymentRepository();
const shipmentRepository = new MySQLShipmentRepository();
const returnRepository = new MySQLReturnRepository();
const operationRepository = new MySQLOperationRepository(userRepository);
const auditLogRepository = new MongoAuditLogRepository();

// --- Security adapters -----------------------------------------------------
const passwordService = new BcryptPasswordService();
const jwtService = new JwtTokenService();

// --- Application use cases -------------------------------------------------
const createUserUseCase = new CreateUserUseCase(
  userRepository,
  auditLogRepository,
  passwordService,
);
const createProductUseCase = new CreateProductUseCase(productRepository);
const listProductsUseCase = new ListProductsUseCase(productRepository);
const loginUseCase = new LoginUseCase(
  userRepository,
  auditLogRepository,
  passwordService,
  jwtService,
  appConfig.security.jwtExpiresInSeconds,
);

// --- Application services --------------------------------------------------
const publicAccessService = new PublicAccessService(
  userRepository,
  productRepository,
  buyerRepository,
  auditLogRepository,
  passwordService,
  jwtService,
);
const buyerService = new BuyerService(
  buyerRepository,
  cartRepository,
  orderRepository,
  inventoryRepository,
  productRepository,
  auditLogRepository,
);
const sellerService = new SellerService(
  sellerRepository,
  productRepository,
  orderRepository,
  inventoryRepository,
  productVariantRepository,
  warehouseRepository,
  auditLogRepository,
);

// --- HTTP controllers ------------------------------------------------------
const userController = new UserController(createUserUseCase);
const productController = new ProductController(createProductUseCase, listProductsUseCase);
const authController = new AuthController(loginUseCase, jwtService, publicAccessService);
const catalogController = new CatalogController(publicAccessService);
const buyerController = new BuyerController(buyerService);
const sellerController = new SellerController(sellerService);

const logisticsOperatorService = new LogisticsOperatorService(
  warehouseRepository,
  inventoryRepository,
  shipmentRepository,
  orderRepository,
  returnRepository,
  productRepository,
  auditLogRepository,
);
const administratorService = new AdministratorService(
  userRepository,
  buyerRepository,
  sellerRepository,
  productRepository,
  orderRepository,
  returnRepository,
  invoiceRepository,
  paymentRepository,
  operationRepository,
  auditLogRepository,
);
const supervisorService = new SupervisorService(
  orderRepository,
  paymentRepository,
  shipmentRepository,
  returnRepository,
  buyerRepository,
  sellerRepository,
);

const logisticsController = new LogisticsController(logisticsOperatorService);
const adminController = new AdministratorController(administratorService);
const supervisorController = new SupervisorController(supervisorService);

// --- Auth middleware -------------------------------------------------------
const authMiddleware = createAuthMiddleware({ jwtService, userRepository });

// --- Route registration ----------------------------------------------------
app.use('/api/v1', createAuthRoutes(authController, authMiddleware));
app.use('/api/v1', createUserRoutes(userController, authMiddleware));
app.use('/api/v1', createProductRoutes(productController, authMiddleware));
app.use('/api/v1', createCatalogRoutes(catalogController));
app.use('/api/v1', createBuyerRoutes(buyerController, authMiddleware));
app.use('/api/v1', createSellerRoutes(sellerController, authMiddleware));
app.use('/api/v1', createLogisticsRoutes(logisticsController, authMiddleware));
app.use('/api/v1', createAdminRoutes(adminController, authMiddleware));
app.use('/api/v1', createSupervisorRoutes(supervisorController, authMiddleware));

// Fallback 404 and centralized error envelope (must be registered last).
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown.
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

await initDb();
await initMongo();

app.listen(appConfig.server.port, () => {
  console.log(`NexusMarket is running on port ${appConfig.server.port}`);
});
