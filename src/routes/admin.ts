import express from 'express';
import { validateSlug, seedAuthors, seedStaticPages } from '../controllers/adminController';
import { authenticate, requireAdmin, requireEditor } from '../middleware/auth';

const router = express.Router();

// Editor and Admin routes
router.get('/validate-slug', authenticate, requireEditor, validateSlug);

// Admin-only routes
router.post('/seed-authors', authenticate, requireAdmin, seedAuthors);
router.post('/seed-static-pages', authenticate, requireAdmin, seedStaticPages);

export { router as adminRoutes };