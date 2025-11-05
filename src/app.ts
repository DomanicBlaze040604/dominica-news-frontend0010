import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import responseTime from 'response-time';
import path from 'path';

// Import routes
import { authRoutes } from './routes/auth';
import { articleRoutes } from './routes/articles';
import { authorRoutes } from './routes/authors';
import { categoryRoutes } from './routes/categories';
import { settingsRoutes } from './routes/settings';
import { imageRoutes } from './routes/images';
import { breakingNewsRoutes } from './routes/breaking-news';
import { staticPageRoutes } from './routes/staticPages';
import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/users';
import sitemapRoutes from './routes/sitemap';
import { healthRoutes } from './routes/health';
import { errorRoutes } from './routes/errors';
import { errorHandler } from './middleware/errorHandler';
import { checkMaintenanceMode } from './middleware/maintenance';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLogger, slowRequestLogger } from './middleware/requestLogger';

// Load env
dotenv.config();

const app: Application = express();

// -----------------------------------------------------------------------------
// 🛡️ Security
// -----------------------------------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: false }));

// -----------------------------------------------------------------------------
// 🌍 CORS
// -----------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://dominicanews.dm',
  'https://www.dominicanews.dm',
  'https://dominicanews.vercel.app',
  'https://dominica-news-frontend0000001.vercel.app',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(','));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 CORS Blocked Request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-request-id'],
  })
);

// -----------------------------------------------------------------------------
// ⚙️ Rate Limiting
// -----------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 50000, // 50,000 requests per minute (very generous)
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
  skip: (req) =>
    req.path.startsWith('/api/health') ||
    req.path.startsWith('/api/articles') ||
    req.path.startsWith('/api/categories') ||
    req.path.startsWith('/api/static-pages') ||
    req.path.startsWith('/api/authors') ||
    req.path.startsWith('/api/images'),
});
app.use(limiter);

// -----------------------------------------------------------------------------
// ⚡ Middleware
// -----------------------------------------------------------------------------
app.use(requestIdMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(responseTime());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  app.use(requestLogger);
  app.use(slowRequestLogger(2000)); // Log requests slower than 2 seconds
}

// -----------------------------------------------------------------------------
// 🖼️ Static Files
// -----------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -----------------------------------------------------------------------------
// 🛡️ Maintenance Mode Check
// -----------------------------------------------------------------------------
app.use(checkMaintenanceMode);

// -----------------------------------------------------------------------------
// 🚏 API Routes
// -----------------------------------------------------------------------------

// ✅ Admin route aliases (frontend expects /api/admin/...) - MOVED TO TOP
console.log('Registering admin routes...');

// Test admin endpoint
app.get('/api/admin/test', (req, res) => {
  console.log('Admin test endpoint hit!');
  res.json({ success: true, message: 'Admin test endpoint working' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/articles', articleRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/authors', authorRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/images', imageRoutes);
app.use('/api/admin/breaking-news', breakingNewsRoutes);
app.use('/api/admin/static-pages', staticPageRoutes);
console.log('Admin routes registered successfully');

// Regular API routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

// Health check and error reporting routes
app.use('/api/health', healthRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/breaking-news', breakingNewsRoutes);
app.use('/api/static-pages', staticPageRoutes);

// Sitemap routes (served at root level)
app.use('/', sitemapRoutes);

// -----------------------------------------------------------------------------
// 🏠 Root
// -----------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    app: 'Dominica News API',
    version: '2.0.0',
    domain: 'https://dominicanews.dm',
    status: 'running ✅',
  });
});

// -----------------------------------------------------------------------------
// ❌ 404
// -----------------------------------------------------------------------------
app.use('*', (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: `Not found - ${req.originalUrl}` });
});

// -----------------------------------------------------------------------------
// 🧱 Global Error Handler
// -----------------------------------------------------------------------------
app.use(errorHandler);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Unexpected Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

export default app;
