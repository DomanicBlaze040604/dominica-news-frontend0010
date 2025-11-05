import express from 'express';
import {
  getStaticPages,
  getStaticPagesAdmin,
  getStaticPageBySlug,
  getStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
  togglePageStatus,
  getMenuPages,
  reorderMenuPages,
  getEditorialTeamPage
} from '../controllers/staticPageController';
import { authenticate, requireAdmin, requireEditor } from '../middleware/auth';
import { validateStaticPage } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getStaticPages);
router.get('/menu', getMenuPages);
router.get('/editorial-team', getEditorialTeamPage);
router.get('/slug/:slug', getStaticPageBySlug);

// Protected routes - Editors can view and manage static pages
router.get('/admin', authenticate, requireEditor, getStaticPagesAdmin);
router.get('/admin/:id', authenticate, requireEditor, getStaticPageById);
router.post('/admin', authenticate, requireEditor, validateStaticPage, createStaticPage);
router.put('/admin/:id', authenticate, requireEditor, updateStaticPage);
router.patch('/admin/:id/toggle-status', authenticate, requireEditor, togglePageStatus);

// Admin-only routes - Only admins can delete pages and reorder menu
router.delete('/admin/:id', authenticate, requireAdmin, deleteStaticPage);
router.put('/reorder', authenticate, requireAdmin, reorderMenuPages);

export { router as staticPageRoutes };