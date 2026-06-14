import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { recordApiError } from '../services/adminTelemetry';
import { HttpError } from '../utils/http';

export function errorHandler(
  error: Error & { statusCode?: number; code?: number },
  req: Request & { userId?: string },
  res: Response,
  _next: NextFunction
) {
  const statusCode =
    error.code === 11000 ? 409 : error instanceof HttpError ? error.statusCode : (error.statusCode ?? 500);
  const jwtStatusCode =
    error instanceof TokenExpiredError || error instanceof JsonWebTokenError ? 401 : statusCode;

  recordApiError({
    method: req.method,
    path: req.originalUrl,
    statusCode: jwtStatusCode,
    message: error.message || 'Something went wrong.',
    stack: error.stack,
    userId: req.userId,
  });

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Email or phone already exists.' });
  }

  if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
    return res.status(401).json({ message: 'Authentication expired. Please sign in again.' });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(error.statusCode ?? 500).json({
    message: error.message || 'Something went wrong.',
  });
}
