import type { Request, Response } from 'express';
import type { LoginUseCase } from '../../../application/use-cases/LoginUseCase.js';
import type { JwtServicePort } from '../../../domain/ports/out/JwtServicePort.js';
import { ApiError } from '../errors/ApiError.js';
import { extractBearerToken } from '../middlewares/auth.js';
import { requireEmail, requireObject, requireString } from '../validation/validator.js';

export class AuthController {
  private readonly loginUseCase: LoginUseCase;
  private readonly jwtService: JwtServicePort;

  constructor(loginUseCase: LoginUseCase, jwtService: JwtServicePort) {
    this.loginUseCase = loginUseCase;
    this.jwtService = jwtService;
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
    res.status(204).send();
  }
}
