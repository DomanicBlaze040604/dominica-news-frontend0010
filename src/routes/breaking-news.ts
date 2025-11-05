import express from 'express';
import { breakingNewsController } from '../controllers/breakingNewsController';
import { authenticate, requireAdmin, requireEditor } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/active', breakingNewsController.getActive);

// Protected routes - Editors can manage breaking news
router.get('/', authenticate, requireEditor, breakingNewsController.getAll);
router.post('/', authenticate, requireEditor, breakingNewsController.create);
router.put('/:id', authenticate, requireEditor, breakingNewsController.update);
router.patch('/:id/toggle', authenticate, requireEditor, breakingNewsController.toggleActive);

// Admin-only routes - Only admins can delete breaking news
router.delete('/:id', authenticate, requireAdmin, breakingNewsController.delete);

export { router as breakingNewsRoutes };
