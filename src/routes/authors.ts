import express from 'express';
import {
  createAuthor,
  getAuthors,
  getAuthorById,
  getAuthorBySlug,
  updateAuthor,
  deleteAuthor,
  getAuthorStats,
  toggleAuthorStatus
} from '../controllers/authorController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAuthors);
router.get('/slug/:slug', getAuthorBySlug);
router.get('/:id', getAuthorById);
router.get('/:id/stats', getAuthorStats);

// Protected routes (require authentication)
router.post('/', authenticateToken, requireRole(['admin']), createAuthor);
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), updateAuthor);
router.patch('/:id/toggle-status', authenticateToken, requireRole(['admin']), toggleAuthorStatus);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteAuthor);

export { router as authorRoutes };