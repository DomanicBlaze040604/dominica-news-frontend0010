import { Router, Request, Response, NextFunction } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticles,
} from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { categoryValidation, categoryUpdateValidation } from '../utils/validators';
import { categoryCache, publicContentCache, invalidateCache } from '../middleware/cache';

const router = Router();

// Public routes (with caching)
router.get('/', categoryCache, getCategories);
router.get('/:slug', categoryCache, getCategoryBySlug);
router.get('/:slug/articles', publicContentCache, getCategoryArticles);

// Admin routes (with cache invalidation)
router.post('/', authenticate, requireAdmin, categoryValidation, (req: Request, res: Response, next: NextFunction) => {
  invalidateCache('category:');
  next();
}, createCategory);

router.put('/:id', authenticate, requireAdmin, categoryUpdateValidation, (req: Request, res: Response, next: NextFunction) => {
  invalidateCache('category:');
  next();
}, updateCategory);

router.delete('/:id', authenticate, requireAdmin, (req, res, next) => {
  invalidateCache('category:');
  next();
}, deleteCategory);

export { router as categoryRoutes };