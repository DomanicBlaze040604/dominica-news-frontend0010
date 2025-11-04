import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import responseTime from 'response-time';

// Import routes
import { authRoutes } from './routes/auth';
import { articleRoutes } from './routes/articles';
import { authorRoutes } from './routes/authors';
import { categoryRoutes } from './routes/categories';
import { settingsRoutes } from './routes/settings';
import healthRoutes from './routes/health';
import { debugRoutes } from './routes/debug';
import { testDbRoutes } from './routes/test-db';
import { imageRoutes } from './routes/images';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();

// -----------------------------------------------------------------------------
// 🛡️ Security
// -----------------------------------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: false }));

// -----------------------------------------------------------------------------
// 🌍 CORS Configuration
// -----------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://dominicanews.dm',
  'https://www.dominicanews.dm',
  'https://dominicanews.vercel.app',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(','));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile / Postman etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`❌ CORS blocked request from: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// -----------------------------------------------------------------------------
// ⚙️ Rate Limiting (Production-Scale)
// -----------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 5000, // 5000 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
  skip: (req) => {
    // Skip health checks and common reads (read-heavy public traffic)
    return (
      req.path === '/api/health' ||
      req.path.startsWith('/api/settings') ||
      req.path.startsWith('/api/articles') ||
      req.path.startsWith('/api/categories')
    );
  },
});
app.use(limiter);

// -----------------------------------------------------------------------------
// ⚡ Performance Middleware
// -----------------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(responseTime()); // Track latency for monitoring

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// -----------------------------------------------------------------------------
// 🧠 Cache-Control (for static GET endpoints)
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  }
  next();
});

// -----------------------------------------------------------------------------
// 🚏 API Routes
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test-db', testDbRoutes);
app.use('/api/images', imageRoutes);

// -----------------------------------------------------------------------------
// 🏠 Root Route
// -----------------------------------------------------------------------------
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    app: 'Dominica News API',
    version: '1.0.0',
    status: 'running ✅',
    domain: 'https://dominicanews.dm',
    environment: process.env.NODE_ENV || 'development',
  });
});

// -----------------------------------------------------------------------------
// ❌ 404 Handler
// -----------------------------------------------------------------------------
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// -----------------------------------------------------------------------------
// 🧱 Global Error Handler
// -----------------------------------------------------------------------------
app.use(errorHandler);

// -----------------------------------------------------------------------------
// 🚨 Fallback Error Safety Net
// -----------------------------------------------------------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Unexpected Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

export default app;
