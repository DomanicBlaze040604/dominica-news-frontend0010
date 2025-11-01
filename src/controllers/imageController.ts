import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { Image } from '../models/Image';
import { CustomError } from '../middleware/errorHandler';
import {
  getImageMetadata,
  generateThumbnail,
  optimizeImage,
  deleteImageFiles,
  ensureThumbnailsDirectory,
} from '../utils/imageProcessor';

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new CustomError('No image file provided', 400);
    }

    const uploadedBy = (req as any).user.id; // From authentication middleware
    const file = req.file;

    // Ensure thumbnails directory exists
    await ensureThumbnailsDirectory();

    // Get image metadata
    const metadata = await getImageMetadata(file.path);

    // Generate thumbnail
    const thumbnailPath = path.join(
      path.dirname(file.path),
      'thumbnails',
      `thumb-${file.filename}`
    );
    await generateThumbnail(file.path, thumbnailPath, {
      width: 300,
      height: 300,
      quality: 80,
    });

    // Optimize the original image
    const optimizedPath = path.join(
      path.dirname(file.path),
      `optimized-${file.filename}`
    );
    await optimizeImage(file.path, optimizedPath, 85);

    // Replace original with optimized version
    const fs = require('fs/promises');
    await fs.unlink(file.path); // Delete original
    await fs.rename(optimizedPath, file.path); // Rename optimized to original

    // Create image record in database
    const image = new Image({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      width: metadata.width,
      height: metadata.height,
      uploadedBy,
    });

    await image.save();

    // Populate uploader information for response
    const populatedImage = await Image.findById(image._id)
      .populate('uploadedBy', 'fullName')
      .lean();

    // Transform image to include populated data
    const transformedImage = {
      ...populatedImage,
      uploader: (populatedImage as any).uploadedBy,
      uploadedBy: undefined,
      url: `/api/images/${file.filename}`,
      thumbnailUrl: `/api/images/thumbnails/thumb-${file.filename}`,
    };

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: transformedImage,
      },
    });
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file) {
      try {
        await deleteImageFiles(req.file.filename);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    next(error);
  }
};

export const getImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 images per page
    const skip = (page - 1) * limit;

    // Get images with populated uploader information
    const images = await Image.find()
      .populate('uploadedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalImages = await Image.countDocuments();

    // Transform images to include URLs and populated data
    const transformedImages = images.map((image: any) => ({
      ...image,
      uploader: image.uploadedBy,
      uploadedBy: undefined,
      url: `/api/images/${image.filename}`,
      thumbnailUrl: `/api/images/thumbnails/thumb-${image.filename}`,
    }));

    res.status(200).json({
      success: true,
      data: {
        images: transformedImages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalImages / limit),
          totalImages,
          hasNextPage: page < Math.ceil(totalImages / limit),
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);
    if (!image) {
      throw new CustomError('Image not found', 404);
    }

    // Delete image files from filesystem
    await deleteImageFiles(image.filename);

    // Delete image record from database
    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getImageById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id)
      .populate('uploadedBy', 'fullName')
      .lean();

    if (!image) {
      throw new CustomError('Image not found', 404);
    }

    // Transform image to include URLs and populated data
    const transformedImage = {
      ...image,
      uploader: (image as any).uploadedBy,
      uploadedBy: undefined,
      url: `/api/images/${image.filename}`,
      thumbnailUrl: `/api/images/thumbnails/thumb-${image.filename}`,
    };

    res.status(200).json({
      success: true,
      data: {
        image: transformedImage,
      },
    });
  } catch (error) {
    next(error);
  }
};