import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Import routes
import { authRoutes } from './routes/auth';
import { articleRoutes } from './routes/articles';
import { authorRoutes } from './routes/authors';
import { categoryRoutes } from './routes/categories';
import healthRoutes from './routes/health';
import { debugRoutes } from './routes/debug';
import { testDbRoutes } from './routes/test-db';
import { imageRoutes } from './routes/images';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test-db', testDbRoutes);
app.use('/api/images', imageRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Dominica News API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware 

export default app;