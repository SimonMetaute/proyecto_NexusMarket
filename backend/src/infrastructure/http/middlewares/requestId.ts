/**
 * Request correlation middleware.
 *
 * Echoes an incoming `X-Request-ID` or generates one, exposing it as
 * `req.requestId` and in the `X-Request-ID` response header so the global
 * error envelope can reference it (SDD/Adapters/Api-rest-endpoints.md §2).
 */
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const HEADER = 'X-Request-ID';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(HEADER);
  const requestId = incoming !== undefined && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

  req.requestId = requestId;
  res.setHeader(HEADER, requestId);

  next();
}
