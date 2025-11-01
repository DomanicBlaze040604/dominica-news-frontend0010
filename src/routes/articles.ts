import { Router } from 'express';
import {
  getPublishedArticles,
  getArticleBySlug,
  getRelatedArticles,
  getCategoryArticles,
} from '../controllers/articleController';
import { publicContentCache, articleCache } from '../middleware/cache';

const router = Router();

// Public routes for articles (with caching)
router.get('/', publicContentCache, getPublishedArticles);

// Category-specific articles route (must come before /:slug)
router.get('/category/:slug', publicContentCache, getCategoryArticles);

router.get('/:slug', articleCache, getArticleBySlug);
router.get('/:slug/related', publicContentCache, getRelatedArticles);

export { router as articleRoutes };