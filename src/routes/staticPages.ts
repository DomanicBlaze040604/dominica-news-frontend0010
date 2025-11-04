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
  reorderMenuPages
} from '../controllers/staticPageController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateStaticPage } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getStaticPages);
router.get('/menu', getMenuPages);
router.get('/slug/:slug', getStaticPageBySlug);

// Admin routes
router.get('/admin', authenticateToken, requireRole(['admin', 'editor']), getStaticPagesAdmin);
router.get('/admin/:id', authenticateToken, requireRole(['admin', 'editor']), getStaticPageById);
router.post('/admin', authenticateToken, requireRole(['admin']), validateStaticPage, createStaticPage);
router.put('/admin/:id', authenticateToken, requireRole(['admin']), updateStaticPage);
router.delete('/admin/:id', authenticateToken, requireRole(['admin']), deleteStaticPage);
router.patch('/admin/:id/toggle-status', authenticateToken, requireRole(['admin']), togglePageStatus);
router.put('/reorder', authenticateToken, requireRole(['admin']), reorderMenuPages);

export { router as staticPageRoutes };