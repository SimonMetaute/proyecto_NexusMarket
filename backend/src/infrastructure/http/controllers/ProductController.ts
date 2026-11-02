import type { Request, Response } from 'express';
import type { CreateProductUseCase } from '../../../application/use-cases/CreateProductUseCase.js';
import { ProductNameAlreadyExistsError } from '../../../application/use-cases/CreateProductUseCase.js';
import { ProductMapper } from '../mappers/ProductMapper.js';
import type { ListProductsUseCase } from '../../../application/use-cases/ListProductsUseCase.js';

export class ProductController {
  private readonly createProductUseCase: CreateProductUseCase;
  private readonly listProductsUseCase: ListProductsUseCase;

  constructor(createProductUseCase: CreateProductUseCase, listProductsUseCase: ListProductsUseCase) {
    this.createProductUseCase = createProductUseCase;
    this.listProductsUseCase = listProductsUseCase;
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.createProductUseCase.execute(req.body);
      res.status(201).json(ProductMapper.toResponse(product));
    } catch (error) {
      if (error instanceof ProductNameAlreadyExistsError) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Bad Request' });
      }
    }
  }
  async listProducts(_req: Request, res: Response): Promise<void> {
    try {
      const products = await this.listProductsUseCase.execute();
      res.status(200).json(products.map(ProductMapper.toResponse));
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
}
}
