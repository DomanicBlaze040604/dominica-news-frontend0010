import { Router } from 'express';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

// Serve images publicly
router.get('/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new CustomError('Invalid filename', 400);
    }

    const imagePath = path.join(__dirname, '../../uploads', filename);
    
    // Set appropriate headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Type', 'image/*');
    
    // Send file
    res.sendFile(imagePath, (err) => {
      if (err) {
        next(new CustomError('Image not found', 404));
      }
    });
  } catch (error) {
    next(error);
  }
});

// Serve thumbnails publicly
router.get('/thumbnails/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new CustomError('Invalid filename', 400);
    }

    const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', filename);
    
    // Set appropriate headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Type', 'image/*');
    
    // Send file
    res.sendFile(thumbnailPath, (err) => {
      if (err) {
        next(new CustomError('Thumbnail not found', 404));
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as imageRoutes };