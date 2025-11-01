import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get image metadata using Sharp
 */
export const getImageMetadata = async (filePath: string): Promise<ImageMetadata> => {
  try {
    const metadata = await sharp(filePath).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: metadata.size || 0,
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error}`);
  }
};

/**
 * Generate thumbnail for an image
 */
export const generateThumbnail = async (
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<void> => {
  try {
    const { width = 300, height = 300, quality = 80 } = options;

    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality })
      .toFile(outputPath);
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error}`);
  }
};

/**
 * Optimize image for web
 */
export const optimizeImage = async (
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<void> => {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      await sharp(inputPath)
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
    } else if (metadata.format === 'png') {
      await sharp(inputPath)
        .png({ quality, progressive: true })
        .toFile(outputPath);
    } else if (metadata.format === 'webp') {
      await sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath);
    } else {
      // Convert to JPEG for unsupported formats
      await sharp(inputPath)
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
    }
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error}`);
  }
};

/**
 * Delete image file and its thumbnail
 */
export const deleteImageFiles = async (filename: string): Promise<void> => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const imagePath = path.join(uploadsDir, filename);
    const thumbnailPath = path.join(uploadsDir, 'thumbnails', `thumb-${filename}`);

    // Delete main image
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      // File might not exist, continue
    }

    // Delete thumbnail
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // Thumbnail might not exist, continue
    }
  } catch (error) {
    throw new Error(`Failed to delete image files: ${error}`);
  }
};

/**
 * Ensure thumbnails directory exists
 */
export const ensureThumbnailsDirectory = async (): Promise<void> => {
  try {
    const thumbnailsDir = path.join(__dirname, '../../uploads/thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create thumbnails directory: ${error}`);
  }
};