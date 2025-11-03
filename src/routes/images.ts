import express from 'express';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageInfo
} from '../controllers/imageController';
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError 
} from '../middleware/upload';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Upload single image
router.post('/upload', 
  authenticateToken, 
  requireRole(['admin', 'editor']),
  uploadSingle('image'), 
  handleUploadError, 
  uploadImage
);

// Upload multiple images
router.post('/upload-multiple', 
  authenticateToken, 
  requireRole(['admin', 'editor']),
  uploadMultiple('images', 10), 
  handleUploadError, 
  uploadMultipleImages
);

// Get image info
router.get('/:filename/info', getImageInfo);

// Delete image
router.delete('/:filename', 
  authenticateToken, 
  requireRole(['admin', 'editor']), 
  deleteImage
);

export { router as imageRoutes };