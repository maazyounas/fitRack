import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './src/middleware/errorHandler';
import { HttpError } from './src/utils/http';

const req = {
  method: 'POST',
  originalUrl: '/api/auth/login',
} as Request;

const res = {
  status: function(code: number) {
    console.log('STATUS:', code);
    return this;
  },
  json: function(data: any) {
    console.log('JSON:', data);
    return this;
  }
} as Response;

const next: NextFunction = () => {};

const error = new HttpError(401, 'Invalid credentials.');
errorHandler(error as any, req as any, res, next);
