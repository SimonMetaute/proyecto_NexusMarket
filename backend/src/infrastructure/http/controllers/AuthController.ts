import type { Request, Response } from 'express';
import type { LoginUseCase } from '../../../application/use-cases/LoginUseCase.js';
import type { PublicAccessPort } from '../../../domain/ports/in/PublicAccessPort.js';
import type { JwtServicePort } from '../../../domain/ports/out/JwtServicePort.js';
import type { User } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import { extractBearerToken } from '../middlewares/auth.js';
import {
  requireEmail,
  requireObject,
  requireString,
  requirePassword,
} from '../validation/validator.js';

export class AuthController {
  private readonly loginUseCase: LoginUseCase;
  private readonly jwtService: JwtServicePort;
  private readonly publicAccess: PublicAccessPort;

  constructor(
    loginUseCase: LoginUseCase,
    jwtService: JwtServicePort,
    publicAccess: PublicAccessPort,
  ) {
    this.loginUseCase = loginUseCase;
    this.jwtService = jwtService;
    this.publicAccess = publicAccess;
  }

  async login(req: Request, res: Response): Promise<void> {
    const body = requireObject(req.body);
    const email = requireEmail(body);
    const password = requireString(body, 'password', { minLength: 1, maxLength: 128 });

    const result = await this.loginUseCase.execute({ email, password });
    res.status(200).json(result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = extractBearerToken(req);
    if (token === null) {
      throw ApiError.authenticationRequired();
    }

    await this.jwtService.revoke(token);
    const user = req.user as User | undefined;
    if (user !== undefined) {
      await this.publicAccess.logout(user);
    }
    res.status(204).send();
  }

  async registerBuyer(req: Request, res: Response): Promise<void> {
    const body = requireObject(req.body);
    const email = requireEmail(body);
    const password = requirePassword(body);
    const firstName = requireString(body, 'firstName', { maxLength: 100 });
    const lastName = requireString(body, 'lastName', { maxLength: 100 });
    const phone = requireString(body, 'phoneNumber', { minLength: 5, maxLength: 50 });
    const identification = requireString(body, 'identification', { maxLength: 100 });

    const buyer = {
      buyerId: globalThis.crypto.randomUUID(),
      userId: email,
      deliveryAddresses: [],
      paymentMethods: [],
      trustLevel: 'Medium',
    } as any;

    const user = await this.publicAccess.registerBuyer(buyer, password);
    res.status(201).json({
      userId: user.userId,
      email: user.email,
      role: user.userType,
      status: user.status,
      message: 'Buyer registered successfully',
    });
  }
}
