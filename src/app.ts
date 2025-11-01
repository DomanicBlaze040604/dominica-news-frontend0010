import express from 'express';
import cors from 'cors';
import path from 'path';
import { corsOptions, rateLimiter, helmetConfig, sanitizeInput, securityHeaders } from './middleware/security';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);
app.use(cors());
app.use(rateLimiter);
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (removed - now handled by image routes)

// API routes
import { authRoutes } from './routes/auth';
import { categoryRoutes } from './routes/categories';
import { articleRoutes } from './routes/articles';
import { adminRoutes } from './routes/admin';
import { imageRoutes } from './routes/images';
import healthRoutes from './routes/health';

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;