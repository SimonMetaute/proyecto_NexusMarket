/**
 * Application Use Case: CreateProduct.
 *
 * Orchestrates the "register a new product" flow by coordinating the domain
 * (the `Product` aggregate) with an outbound port (`ProductRepository`).
 *
 * DDD / Clean Architecture rules applied:
 *  - Depends only on the `ProductRepository` INTERFACE (injected via constructor),
 *    never on a concrete database or an HTTP framework. This is Dependency
 *    Inversion: the application layer defines what it needs, the infrastructure
 *    layer provides it.
 *  - Contains NO database access, NO Express/HTTP code, and NO external
 *    libraries. Only domain entities, the port interface, and language
 *    built-ins (`crypto`, `Date`) are used.
 *  - Enforces the business rule "SKU must be globally unique."
 *    (SDD Section 2.6) at this layer, since it requires querying persistence.
 */
import { Product } from '../../domain/entities/Product.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';

/**
 * Input data for creating a product.
 * Only business data provided by the caller; system-generated values
 * (productId, createdAt) are produced inside the use case.
 */
export interface CreateProductParams {
  name: string;
  description: string;
  price: number;
  sellerId: string;
  stock: number;
}

/**
 * Business error thrown when the product name is already registered.
 * Belongs to the application layer so upper layers can map it to an
 * appropriate response without coupling to infrastructure.
 */
export class ProductNameAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`The product name "${name}" is already registered.`);
    this.name = 'ProductNameAlreadyExistsError';
  }
}

export class CreateProductUseCase {
  private readonly productRepository: ProductRepository;

  /**
   * The port is injected through the constructor. The concrete implementation
   * (e.g. an in-memory, SQL, or NoSQL adapter) is provided by the caller,
   * keeping this use case pure and testable.
   */
  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Executes the use case:
   *  1. Verifies the product name is not already registered (business rule).
   *  2. Builds the `Product` aggregate: `productId` via `crypto.randomUUID()`
   *     and `createdAt` with the current date.
   *  3. Persists it via the injected repository.
   *
   * @returns the created `Product` aggregate.
   * @throws ProductNameAlreadyExistsError if the name already exists.
   */
  async execute(params: CreateProductParams): Promise<Product> {
    // 1. Uniqueness check (business rule).
    const existingProducts = await this.productRepository.findAll();
    if (existingProducts.some(p => p.name === params.name)) {
      throw new ProductNameAlreadyExistsError(params.name);
    }

    // 2. Build the domain aggregate (system-generated fields use built-ins).
    const product = new Product({
      productId: globalThis.crypto.randomUUID(),
      name: params.name,
      description: params.description,
      price: params.price,
      sellerId: params.sellerId,
      stock: params.stock,
      createdAt: new Date(),
    });

    // 3. Persist through the injected port.
    await this.productRepository.save(product);

    return product;
  }
}
