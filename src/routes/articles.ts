import express from 'express';
import {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getBreakingNews,
  getFeaturedArticles
} from '../controllers/articleController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateArticle } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getArticles);
router.get('/breaking', getBreakingNews);
router.get('/featured', getFeaturedArticles);
router.get('/:slug', getArticleBySlug);

// Protected routes (require authentication)
router.post('/', authenticateToken, requireRole(['admin', 'editor']), validateArticle, createArticle);
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), updateArticle);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteArticle);

export { router as articleRoutes };