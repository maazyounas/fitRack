import cors from 'cors';
import express, { Request } from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import { authRoutes } from './routes/authRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { exerciseRoutes } from './routes/exerciseRoutes';
import { nutritionRoutes } from './routes/nutritionRoutes';
import { progressRoutes } from './routes/progressRoutes';
import { communityRoutes } from './routes/communityRoutes';
import { userRoutes } from './routes/userRoutes';
import { workoutRoutes } from './routes/workoutRoutes';
import { errorHandler } from './middleware/errorHandler';
import { recordRequestLog } from './services/adminTelemetry';

export const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    recordRequestLog({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userId: (req as Request & { userId?: string }).userId,
    });
  });

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/community', communityRoutes);
app.use(errorHandler);
