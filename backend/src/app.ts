import cors from 'cors';
import express, { Request } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
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
import bodyAnalysisRoutes from './routes/bodyAnalysis';
import { errorHandler } from './middleware/errorHandler';
import { recordRequestLog } from './services/adminTelemetry';

export const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.nodeEnv === 'production',
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.nodeEnv === 'production' ? env.clientUrl : (origin, callback) => {
      // Allow all origins in development, even without origin header
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Skip-Auth-Refresh', 'x-skip-auth-refresh'],
  })
);

// ── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Request telemetry ────────────────────────────────────────────────────────
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

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 10 : 10000, // Very relaxed for development to avoid accidental 429s
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait before trying again.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached. Please wait a moment.' },
});

app.use(globalLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv, ts: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
// Apply auth rate limiting only in production to avoid local 429s during development/testing
if (env.nodeEnv === 'production') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  // In development attach routes without rate limiting to prevent accidental blocks
  // Useful while testing signup flows locally.
  // eslint-disable-next-line no-console
  console.warn('Auth rate limiter disabled in development environment.');
  app.use('/api/auth', authRoutes);
}
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/body-analysis', bodyAnalysisRoutes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);
