import express from 'express';
import { appConfig } from './infrastructure/config/appConfig.js';
import { initDb } from './infrastructure/database/init-db.js';
import { initMongo } from './infrastructure/database/mongo-connection.js';
import { MySQLUserRepository } from './infrastructure/repositories/MySQLUserRepository.js';
import { MySQLProductRepository } from './infrastructure/repositories/MySQLProductRepository.js';
import { MongoAuditLogRepository } from './infrastructure/repositories/MongoAuditLogRepository.js';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase.js';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase.js';
import { LoginUseCase } from './application/use-cases/LoginUseCase.js';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase.js';
import { UserController } from './infrastructure/http/controllers/UserController.js';
import { ProductController } from './infrastructure/http/controllers/ProductController.js';
import { AuthController } from './infrastructure/http/controllers/AuthController.js';
import { createProductRoutes } from './infrastructure/http/routes/productRoutes.js';
import { createUserRoutes } from './infrastructure/http/routes/userRoutes.js';
import { createAuthRoutes } from './infrastructure/http/routes/authRoutes.js';
import { requestIdMiddleware } from './infrastructure/http/middlewares/requestId.js';
import { corsMiddleware } from './infrastructure/http/middlewares/cors.js';
import { createAuthMiddleware } from './infrastructure/http/middlewares/auth.js';
import { errorHandler, notFoundHandler } from './infrastructure/http/errors/errorHandler.js';
import { BcryptPasswordService } from './infrastructure/security/BcryptPasswordService.js';
import { JwtTokenService } from './infrastructure/security/JwtTokenService.js';

const app = express();

// Correlation ID first so every log line and error envelope can reference it.
app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

// --- Outbound adapters -----------------------------------------------------
const userRepository = new MySQLUserRepository();
const productRepository = new MySQLProductRepository();
const auditLogRepository = new MongoAuditLogRepository();
const passwordService = new BcryptPasswordService();
const jwtService = new JwtTokenService();

// --- Application use cases -------------------------------------------------
const createUserUseCase = new CreateUserUseCase(userRepository, auditLogRepository, passwordService);
const createProductUseCase = new CreateProductUseCase(productRepository);
const listProductsUseCase = new ListProductsUseCase(productRepository);
const loginUseCase = new LoginUseCase(
  userRepository,
  auditLogRepository,
  passwordService,
  jwtService,
  appConfig.security.jwtExpiresInSeconds,
);

// --- HTTP adapters ---------------------------------------------------------
const userController = new UserController(createUserUseCase);
const productController = new ProductController(createProductUseCase, listProductsUseCase);
const authController = new AuthController(loginUseCase, jwtService);

const authMiddleware = createAuthMiddleware({ jwtService, userRepository });

app.use('/api/v1', createAuthRoutes(authController, authMiddleware));
app.use('/api/v1', createUserRoutes(userController, authMiddleware));
app.use('/api/v1', createProductRoutes(productController, authMiddleware));

// Fallback 404 and centralized error envelope (must be registered last).
app.use(notFoundHandler);
app.use(errorHandler);

await initDb();
await initMongo();

app.listen(appConfig.server.port, () => {
  console.log(`NexusMarket is running on port ${appConfig.server.port}`);
});
