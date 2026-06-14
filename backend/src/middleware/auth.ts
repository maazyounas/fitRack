import { NextFunction, Request, Response } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { SessionModel } from '../models/Session';
import { HttpError } from '../utils/http';
import { verifyAccessToken } from '../utils/tokens';

export async function requireAuth(
  req: Request & { userId?: string; sessionId?: string; isAdmin?: boolean },
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required.');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user || user.deactivatedAt) {
      throw new HttpError(401, 'Account is not available.');
    }

    req.userId = user.id;
    req.isAdmin = Boolean((user as any).isAdmin);
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      next(new HttpError(401, 'Authentication expired. Please sign in again.'));
      return;
    }
    next(error);
  }
}

export function requireAdmin(
  req: Request & { isAdmin?: boolean },
  _res: Response,
  next: NextFunction
) {
  if (!req.isAdmin) {
    next(new HttpError(403, 'Admin access is required.'));
    return;
  }

  next();
}

export async function touchSession(sessionId: string) {
  await SessionModel.findByIdAndUpdate(sessionId, {
    $set: { lastActivityAt: new Date() },
  });
}
