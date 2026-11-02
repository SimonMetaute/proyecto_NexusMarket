import express from 'express';
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
import { createProductRoutes } from './infrastructure/http/routes/productRoutes.js';
import { AuthController } from './infrastructure/http/controllers/AuthController.js';

const app = express();

app.use(express.json());

const userRepository = new MySQLUserRepository();
const productRepository = new MySQLProductRepository();
const auditLogRepository = new MongoAuditLogRepository();

const createUserUseCase = new CreateUserUseCase(userRepository, auditLogRepository);
const createProductUseCase = new CreateProductUseCase(productRepository);
const listProductsUseCase = new ListProductsUseCase(productRepository);
const loginUseCase = new LoginUseCase(userRepository, auditLogRepository);

const userController = new UserController(createUserUseCase);
const productController = new ProductController(createProductUseCase, listProductsUseCase);
const authController = new AuthController(loginUseCase);

app.post('/api/v1/users', userController.createUser.bind(userController));
app.use('/api/v1', createProductRoutes(productController));
app.post('/api/v1/auth/login', authController.login.bind(authController));

const PORT = 3000;

await initDb();
await initMongo();

app.listen(PORT, () => {
  console.log('NexusMarket is running on port 3000');
});
