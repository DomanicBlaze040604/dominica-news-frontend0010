import express from 'express';
import {
  getSettings,
  updateSettings,
  getSocialMedia,
  updateSocialMedia,
  getContactInfo,
  updateContactInfo,
  getSEOSettings,
  updateSEOSettings,
  toggleMaintenanceMode
} from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateSettings } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getSettings);
router.get('/social-media', getSocialMedia);
router.get('/contact', getContactInfo);

// Admin routes
router.put('/', authenticateToken, requireRole(['admin']), validateSettings, updateSettings);
router.put('/social-media', authenticateToken, requireRole(['admin']), updateSocialMedia);
router.put('/contact', authenticateToken, requireRole(['admin']), updateContactInfo);
router.get('/seo', authenticateToken, requireRole(['admin']), getSEOSettings);
router.put('/seo', authenticateToken, requireRole(['admin']), updateSEOSettings);
router.put('/maintenance', authenticateToken, requireRole(['admin']), toggleMaintenanceMode);

export { router as settingsRoutes };