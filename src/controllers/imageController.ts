import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { deleteUploadedFile } from '../middleware/upload';

// Upload single image with processing
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const file = req.file;
    const { resize, quality = 80 } = req.query;

    let processedPath = file.path;

    // Process image if resize parameters provided
    if (resize) {
      const [width, height] = (resize as string).split('x').map(Number);
      
      if (width && height) {
        const processedFilename = `processed-${file.filename}`;
        processedPath = path.join(path.dirname(file.path), processedFilename);

        await sharp(file.path)
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: parseInt(quality as string) })
          .toFile(processedPath);

        // Delete original file
        deleteUploadedFile(file.path);
      }
    }

    // Get file info
    const stats = fs.statSync(processedPath);
    const fileUrl = processedPath.replace(/\\/g, '/');

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: path.basename(processedPath),
        originalName: file.originalname,
        url: `/${fileUrl}`,
        size: stats.size,
        mimetype: file.mimetype
      }
    });
  } catch (error: any) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// Upload multiple images
export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    const { resize, quality = 80 } = req.query;
    const uploadedImages = [];

    for (const file of files) {
      let processedPath = file.path;

      // Process image if resize parameters provided
      if (resize) {
        const [width, height] = (resize as string).split('x').map(Number);
        
        if (width && height) {
          const processedFilename = `processed-${file.filename}`;
          processedPath = path.join(path.dirname(file.path), processedFilename);

          await sharp(file.path)
            .resize(width, height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: parseInt(quality as string) })
            .toFile(processedPath);

          // Delete original file
          deleteUploadedFile(file.path);
        }
      }

      const stats = fs.statSync(processedPath);
      const fileUrl = processedPath.replace(/\\/g, '/');

      uploadedImages.push({
        filename: path.basename(processedPath),
        originalName: file.originalname,
        url: `/${fileUrl}`,
        size: stats.size,
        mimetype: file.mimetype
      });
    }

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    });
  } catch (error: any) {
    // Clean up uploaded files on error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        deleteUploadedFile(file.path);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// Delete image
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Look for file in all upload directories
    const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors'];
    let fileFound = false;

    for (const dir of uploadDirs) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        deleteUploadedFile(filePath);
        fileFound = true;
        break;
      }
    }

    if (!fileFound) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// Get image info
export const getImageInfo = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Look for file in all upload directories
    const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors'];
    let fileInfo = null;

    for (const dir of uploadDirs) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const metadata = await sharp(filePath).metadata();
        
        fileInfo = {
          filename,
          path: `/${filePath.replace(/\\/g, '/')}`,
          size: stats.size,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          created: stats.birthtime,
          modified: stats.mtime
        };
        break;
      }
    }

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error getting image info',
      error: error.message
    });
  }
};