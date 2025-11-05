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
  toggleMaintenanceMode,
  getIndividualSetting,
  getAllIndividualSettings,
  updateIndividualSetting,
  uploadLogoFile,
  uploadLogo,
  deleteLogo,
  submitContactForm
} from '../controllers/settingsController';
import { authenticate, requireAdmin, requireEditor } from '../middleware/auth';
import { validateSettings, validateIndividualSetting, validateContactForm } from '../middleware/validation';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = express.Router();

// Public routes
router.get('/', getAllIndividualSettings); // Changed to support frontend format
router.get('/original', getSettings); // Keep original format for backward compatibility
router.get('/social-media', getSocialMedia);
router.get('/contact', getContactInfo);
router.get('/:key', getIndividualSetting);

// Protected routes - Editors can view settings
router.get('/seo', authenticate, requireEditor, getSEOSettings);

// Admin-only routes - Only admins can modify settings
router.put('/', authenticate, requireAdmin, validateIndividualSetting, handleValidationErrors, updateIndividualSetting);
router.put('/original', authenticate, requireAdmin, validateSettings, handleValidationErrors, updateSettings);
router.put('/social-media', authenticate, requireAdmin, updateSocialMedia);
router.put('/contact', authenticate, requireAdmin, updateContactInfo);
router.put('/seo', authenticate, requireAdmin, updateSEOSettings);
router.put('/maintenance', authenticate, requireAdmin, toggleMaintenanceMode);

// Logo management routes - Admin only
router.post('/logo/upload', authenticate, requireAdmin, uploadLogo.single('logo'), uploadLogoFile);
router.delete('/logo', authenticate, requireAdmin, deleteLogo);

// Contact form submission (public endpoint)
router.post('/contact/submit', validateContactForm, handleValidationErrors, submitContactForm);

// Maintenance status (public endpoint)
router.get('/maintenance/status', async (req, res, next) => {
  try {
    const { getMaintenanceStatus } = await import('../middleware/maintenance');
    getMaintenanceStatus(req, res, next);
  } catch (error) {
    next(error);
  }
});

export { router as settingsRoutes };