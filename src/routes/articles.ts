import express from 'express';
import {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getBreakingNews,
  getFeaturedArticles,
  getCategoryArticles
} from '../controllers/articleController';
import { authenticate, requireAdmin, requireEditor, optionalAuth } from '../middleware/auth';
import { validateArticle } from '../middleware/validation';

const router = express.Router();

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, getArticles);
router.get('/latest', optionalAuth, getArticles); // Alias for homepage
router.get('/breaking', getBreakingNews);
router.get('/featured', getFeaturedArticles);
router.get('/category/:categorySlug', optionalAuth, getCategoryArticles);
// Dynamic slug route must be last to avoid conflicts
router.get('/:slug', optionalAuth, getArticleBySlug);

// Protected routes - Editors and Admins can create and edit
router.post('/', authenticate, requireEditor, validateArticle, createArticle);
router.put('/:id', authenticate, requireEditor, updateArticle);

// Admin-only routes - Only admins can delete
router.delete('/:id', authenticate, requireAdmin, deleteArticle);

export { router as articleRoutes };