import express from 'express';
import cors from 'cors';
import path from 'path';
import { corsOptions, rateLimiter, helmetConfig, sanitizeInput, securityHeaders } from './middleware/security';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import { authRoutes } from './routes/auth';
import { categoryRoutes } from './routes/categories';
import { articleRoutes } from './routes/articles';
import { adminRoutes } from './routes/admin';
import { imageRoutes } from './routes/images';
import healthRoutes from './routes/health';
import { debugRoutes } from './routes/debug';
import { testDbRoutes } from './routes/test-db';
import { seedRoutes } from './routes/seed';

const app = express();

// ✅ 1. Trust Railway / Vercel proxies to handle IPs properly
app.set('trust proxy', 1);

// ✅ 2. Fix malformed X-Forwarded-For headers (prevents rate-limit crash)
app.use((req, res, next) => {
  const xff = req.headers['x-forwarded-for'];
  if (Array.isArray(xff)) {
    req.headers['x-forwarded-for'] = xff[0];
  } else if (typeof xff === 'string' && xff.includes(',')) {
    req.headers['x-forwarded-for'] = xff.split(',')[0].trim();
  }
  next();
});

// ✅ 3. CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ 4. Security middleware
app.use(helmetConfig);
app.use(securityHeaders);

// ✅ 5. Apply rate limiter safely (after proxy fix)
app.use(rateLimiter);
app.use(sanitizeInput);

// ✅ 6. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ 7. Static file serving (optional, for images or uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ 8. Root route for Railway & uptime monitoring
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🚀 Dominica News API is live!',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// ✅ 9. API routes
app.use('/api', healthRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test', testDbRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);

// ✅ 10. Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
