import express from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateCategory } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Protected routes (require authentication)
router.post('/', authenticateToken, requireRole(['admin']), validateCategory, createCategory);
router.put('/:id', authenticateToken, requireRole(['admin']), updateCategory);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteCategory);

export { router as categoryRoutes };