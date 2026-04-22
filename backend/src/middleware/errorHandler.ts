import { NextFunction, Request, Response } from 'express';
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

  recordApiError({
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message || 'Something went wrong.',
    stack: error.stack,
    userId: req.userId,
  });

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Email or phone already exists.' });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(error.statusCode ?? 500).json({
    message: error.message || 'Something went wrong.',
  });
}
