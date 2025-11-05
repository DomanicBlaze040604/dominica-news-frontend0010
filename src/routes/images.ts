import express from 'express';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageInfo,
  serveOptimizedImage,
  getImageOptimizationInfo,
  updateImageMetadata,
  checkImageReferences,
  getImages
} from '../controllers/imageController';
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError 
} from '../middleware/upload';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get images with search and filtering
router.get('/', getImages);

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

// Get optimized image with format negotiation
router.get('/optimized/:filename/:variant?', serveOptimizedImage);

// Get image optimization info
router.get('/:filename/optimization', getImageOptimizationInfo);

// Update image metadata
router.put('/:id/metadata',
  authenticateToken,
  requireRole(['admin', 'editor']),
  updateImageMetadata
);

// Check image references before deletion
router.get('/:id/references',
  authenticateToken,
  requireRole(['admin', 'editor']),
  checkImageReferences
);

// Delete image
router.delete('/:filename', 
  authenticateToken, 
  requireRole(['admin', 'editor']), 
  deleteImage
);

export { router as imageRoutes };