/**
 * Minimal CORS middleware driven by `CORS_ALLOWED_ORIGINS`.
 *
 * The project does not depend on the `cors` package; only the behaviour the
 * frontend needs (credentialless JSON requests + preflight) is implemented.
 */
import type { RequestHandler } from 'express';
import { appConfig } from '../../config/appConfig.js';

const ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization,X-Request-ID';
const EXPOSED_HEADERS = 'X-Request-ID';

export const corsMiddleware: RequestHandler = (req, res, next): void => {
  const origin = req.header('origin');
  if (origin !== undefined && appConfig.cors.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
