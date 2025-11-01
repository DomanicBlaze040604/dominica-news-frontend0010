import { Router } from 'express';
import {
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getAdminArticleById,
} from '../controllers/articleController';
import {
  uploadImage,
  getImages,
  deleteImage,
  getImageById,
} from '../controllers/imageController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { articleValidation, articleUpdateValidation } from '../utils/validators';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Admin article management routes
router.get('/articles', getAdminArticles);
router.get('/articles/:id', getAdminArticleById);
router.post('/articles', articleValidation, handleValidationErrors, createArticle);
router.put('/articles/:id', articleUpdateValidation, handleValidationErrors, updateArticle);
router.delete('/articles/:id', deleteArticle);

// Admin image management routes
router.post('/images/upload', uploadSingle, uploadImage);
router.get('/images', getImages);
router.get('/images/:id', getImageById);
router.delete('/images/:id', deleteImage);

export { router as adminRoutes };