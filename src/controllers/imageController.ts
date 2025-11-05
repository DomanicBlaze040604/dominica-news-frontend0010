import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { deleteUploadedFile } from '../middleware/upload';

// Image processing configuration
const IMAGE_VARIANTS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 300, quality: 85 },
  medium: { width: 800, height: 600, quality: 85 },
  large: { width: 1200, height: 900, quality: 90 },
  original: { quality: 95 }
};

// Helper function to process image variants
const processImageVariants = async (inputPath: string, baseFilename: string, outputDir: string) => {
  const variants: any = {};
  const baseNameWithoutExt = path.parse(baseFilename).name;

  // Get original image metadata
  const metadata = await sharp(inputPath).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  for (const [variantName, config] of Object.entries(IMAGE_VARIANTS)) {
    try {
      let sharpInstance = sharp(inputPath);

      // Apply resizing if not original variant
      if (variantName !== 'original' && 'width' in config && 'height' in config) {
        // Only resize if original is larger than target
        if (originalWidth > config.width || originalHeight > config.height) {
          sharpInstance = sharpInstance.resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // Create WebP variant (preferred format)
      const webpFilename = `${baseNameWithoutExt}-${variantName}.webp`;
      const webpPath = path.join(outputDir, webpFilename);
      
      await sharpInstance
        .clone()
        .webp({ quality: config.quality, effort: 4 })
        .toFile(webpPath);

      // Create JPEG fallback
      const jpegFilename = `${baseNameWithoutExt}-${variantName}.jpg`;
      const jpegPath = path.join(outputDir, jpegFilename);
      
      await sharpInstance
        .clone()
        .jpeg({ quality: config.quality, progressive: true })
        .toFile(jpegPath);

      // Store variant info
      variants[variantName] = {
        webp: {
          filename: webpFilename,
          path: webpPath,
          url: `/${webpPath.replace(/\\/g, '/')}`,
          size: fs.statSync(webpPath).size
        },
        jpeg: {
          filename: jpegFilename,
          path: jpegPath,
          url: `/${jpegPath.replace(/\\/g, '/')}`,
          size: fs.statSync(jpegPath).size
        }
      };
    } catch (error) {
      console.error(`Error processing ${variantName} variant:`, error);
    }
  }

  return variants;
};

// Upload single image with enhanced processing
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const file = req.file;
    const { altText } = req.body;

    // Get original image metadata
    const metadata = await sharp(file.path).metadata();
    
    // Create variants directory with error handling
    const variantsDir = path.join(path.dirname(file.path), 'variants');
    try {
      if (!fs.existsSync(variantsDir)) {
        fs.mkdirSync(variantsDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create variants directory ${variantsDir}:`, error);
      // Continue without variants if directory creation fails
    }

    // Process image variants
    const variants = await processImageVariants(file.path, file.filename, variantsDir);

    // Get original file stats
    const originalStats = fs.statSync(file.path);
    const originalUrl = `/${file.path.replace(/\\/g, '/')}`;

    // Calculate total size savings
    const originalSize = originalStats.size;
    const webpSizes = Object.values(variants).map((v: any) => v.webp.size);
    const totalWebpSize = webpSizes.reduce((sum, size) => sum + size, 0);
    const compressionRatio = ((originalSize - totalWebpSize) / originalSize * 100).toFixed(1);

    // Prepare response data
    const imageData = {
      id: file.filename.split('.')[0],
      filename: file.filename,
      originalName: file.originalname,
      altText: altText || '',
      
      // Original image info
      original: {
        url: originalUrl,
        size: originalSize,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      },

      // Processed variants
      variants,

      // Quick access URLs for common use cases
      urls: {
        thumbnail: variants.thumbnail?.webp.url || variants.thumbnail?.jpeg.url,
        small: variants.small?.webp.url || variants.small?.jpeg.url,
        medium: variants.medium?.webp.url || variants.medium?.jpeg.url,
        large: variants.large?.webp.url || variants.large?.jpeg.url,
        original: originalUrl
      },

      // Processing stats
      processing: {
        variantsCreated: Object.keys(variants).length * 2, // WebP + JPEG for each variant
        compressionRatio: `${compressionRatio}%`,
        totalSize: totalWebpSize,
        originalSize: originalSize
      },

      // Metadata
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        colorSpace: metadata.space
      },

      // Upload info
      uploadedAt: new Date().toISOString(),
      mimetype: file.mimetype
    };

    res.json({
      success: true,
      message: 'Image uploaded and processed successfully',
      data: {
        image: imageData
      }
    });
  } catch (error: any) {
    console.error('Image processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error.message
    });
  }
};

// Upload multiple images with enhanced processing
export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    const { altText } = req.body;
    const uploadedImages = [];
    const processingErrors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Get original image metadata
        const metadata = await sharp(file.path).metadata();
        
        // Create variants directory with error handling
        const variantsDir = path.join(path.dirname(file.path), 'variants');
        try {
          if (!fs.existsSync(variantsDir)) {
            fs.mkdirSync(variantsDir, { recursive: true });
          }
        } catch (error) {
          console.warn(`Failed to create variants directory ${variantsDir}:`, error);
          // Continue without variants if directory creation fails
        }

        // Process image variants
        const variants = await processImageVariants(file.path, file.filename, variantsDir);

        // Get original file stats
        const originalStats = fs.statSync(file.path);
        const originalUrl = `/${file.path.replace(/\\/g, '/')}`;

        // Calculate compression stats
        const originalSize = originalStats.size;
        const webpSizes = Object.values(variants).map((v: any) => v.webp.size);
        const totalWebpSize = webpSizes.reduce((sum, size) => sum + size, 0);
        const compressionRatio = ((originalSize - totalWebpSize) / originalSize * 100).toFixed(1);

        const imageData = {
          id: file.filename.split('.')[0],
          filename: file.filename,
          originalName: file.originalname,
          altText: Array.isArray(altText) ? altText[i] : altText || '',
          
          original: {
            url: originalUrl,
            size: originalSize,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
          },

          variants,

          urls: {
            thumbnail: variants.thumbnail?.webp.url || variants.thumbnail?.jpeg.url,
            small: variants.small?.webp.url || variants.small?.jpeg.url,
            medium: variants.medium?.webp.url || variants.medium?.jpeg.url,
            large: variants.large?.webp.url || variants.large?.jpeg.url,
            original: originalUrl
          },

          processing: {
            variantsCreated: Object.keys(variants).length * 2,
            compressionRatio: `${compressionRatio}%`,
            totalSize: totalWebpSize,
            originalSize: originalSize
          },

          metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
            density: metadata.density,
            colorSpace: metadata.space
          },

          uploadedAt: new Date().toISOString(),
          mimetype: file.mimetype
        };

        uploadedImages.push(imageData);
      } catch (error: any) {
        console.error(`Error processing ${file.originalname}:`, error);
        processingErrors.push({
          filename: file.originalname,
          error: error.message
        });
        
        // Clean up failed file
        deleteUploadedFile(file.path);
      }
    }

    // Calculate batch processing stats
    const totalOriginalSize = uploadedImages.reduce((sum, img) => sum + img.original.size, 0);
    const totalProcessedSize = uploadedImages.reduce((sum, img) => sum + img.processing.totalSize, 0);
    const overallCompressionRatio = totalOriginalSize > 0 
      ? ((totalOriginalSize - totalProcessedSize) / totalOriginalSize * 100).toFixed(1)
      : '0';

    res.json({
      success: true,
      message: `${uploadedImages.length} of ${files.length} images processed successfully`,
      data: {
        images: uploadedImages,
        batchStats: {
          totalProcessed: uploadedImages.length,
          totalFailed: processingErrors.length,
          totalOriginalSize,
          totalProcessedSize,
          overallCompressionRatio: `${overallCompressionRatio}%`,
          variantsPerImage: Object.keys(IMAGE_VARIANTS).length * 2
        },
        errors: processingErrors
      }
    });
  } catch (error: any) {
    console.error('Batch image processing error:', error);
    
    // Clean up uploaded files on error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        deleteUploadedFile(file.path);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing images',
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

// Serve optimized images with format negotiation
export const serveOptimizedImage = async (req: Request, res: Response) => {
  try {
    const { filename, variant = 'medium' } = req.params;
    const acceptHeader = req.headers.accept || '';
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Look for image variants in upload directories
    const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors'];
    let imageFound = false;

    for (const dir of uploadDirs) {
      const variantsDir = path.join(dir, 'variants');
      if (!fs.existsSync(variantsDir)) continue;

      const baseFilename = filename.split('.')[0];
      
      // Prefer WebP if browser supports it
      const supportsWebP = acceptHeader.includes('image/webp');
      const extension = supportsWebP ? 'webp' : 'jpg';
      const variantFilename = `${baseFilename}-${variant}.${extension}`;
      const variantPath = path.join(variantsDir, variantFilename);

      if (fs.existsSync(variantPath)) {
        // Set appropriate headers
        const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
        const stats = fs.statSync(variantPath);
        
        res.set({
          'Content-Type': mimeType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000', // 1 year cache
          'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
          'Vary': 'Accept'
        });

        // Check if client has cached version
        const ifNoneMatch = req.headers['if-none-match'];
        const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
        
        if (ifNoneMatch === etag) {
          return res.status(304).end();
        }

        // Stream the file
        const stream = fs.createReadStream(variantPath);
        stream.pipe(res);
        imageFound = true;
        break;
      }
    }

    if (!imageFound) {
      return res.status(404).json({
        success: false,
        message: 'Image variant not found'
      });
    }
  } catch (error: any) {
    console.error('Error serving optimized image:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving image',
      error: error.message
    });
  }
};

// Get image optimization info
export const getImageOptimizationInfo = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors'];
    let optimizationInfo = null;

    for (const dir of uploadDirs) {
      const originalPath = path.join(dir, filename);
      const variantsDir = path.join(dir, 'variants');
      
      if (fs.existsSync(originalPath) && fs.existsSync(variantsDir)) {
        const originalStats = fs.statSync(originalPath);
        const baseFilename = filename.split('.')[0];
        
        const variants: any = {};
        let totalWebpSize = 0;
        let totalJpegSize = 0;

        // Check each variant
        for (const variantName of Object.keys(IMAGE_VARIANTS)) {
          const webpPath = path.join(variantsDir, `${baseFilename}-${variantName}.webp`);
          const jpegPath = path.join(variantsDir, `${baseFilename}-${variantName}.jpg`);
          
          if (fs.existsSync(webpPath) && fs.existsSync(jpegPath)) {
            const webpStats = fs.statSync(webpPath);
            const jpegStats = fs.statSync(jpegPath);
            
            variants[variantName] = {
              webp: {
                size: webpStats.size,
                url: `/${webpPath.replace(/\\/g, '/')}`
              },
              jpeg: {
                size: jpegStats.size,
                url: `/${jpegPath.replace(/\\/g, '/')}`
              }
            };
            
            totalWebpSize += webpStats.size;
            totalJpegSize += jpegStats.size;
          }
        }

        const webpCompressionRatio = ((originalStats.size - totalWebpSize) / originalStats.size * 100).toFixed(1);
        const jpegCompressionRatio = ((originalStats.size - totalJpegSize) / originalStats.size * 100).toFixed(1);

        optimizationInfo = {
          filename,
          original: {
            size: originalStats.size,
            url: `/${originalPath.replace(/\\/g, '/')}`
          },
          variants,
          stats: {
            originalSize: originalStats.size,
            totalWebpSize,
            totalJpegSize,
            webpCompressionRatio: `${webpCompressionRatio}%`,
            jpegCompressionRatio: `${jpegCompressionRatio}%`,
            variantsCount: Object.keys(variants).length,
            spaceSavedWebp: originalStats.size - totalWebpSize,
            spaceSavedJpeg: originalStats.size - totalJpegSize
          }
        };
        break;
      }
    }

    if (!optimizationInfo) {
      return res.status(404).json({
        success: false,
        message: 'Image optimization info not found'
      });
    }

    res.json({
      success: true,
      data: optimizationInfo
    });
  } catch (error: any) {
    console.error('Error getting optimization info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting optimization info',
      error: error.message
    });
  }
};

// Update image metadata
export const updateImageMetadata = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { altText, title, description, caption, credit, copyright, tags } = req.body;

    // Validate required fields
    if (!altText || altText.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Alt text is required and must be at least 3 characters long'
      });
    }

    // Here you would typically update a database record
    // For now, we'll simulate the update
    const updatedImage = {
      id,
      altText: altText.trim(),
      title: title?.trim(),
      description: description?.trim(),
      caption: caption?.trim(),
      credit: credit?.trim(),
      copyright: copyright?.trim(),
      tags: Array.isArray(tags) ? tags.filter(tag => tag.trim().length > 0) : [],
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Image metadata updated successfully',
      data: {
        image: updatedImage
      }
    });
  } catch (error: any) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating image metadata',
      error: error.message
    });
  }
};

// Get images with search and filtering
export const getImages = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'date',
      sortOrder = 'desc',
      filter = 'all'
    } = req.query;

    // Convert to numbers
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const offset = (pageNum - 1) * limitNum;

    // Get all images from upload directories
    const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors'];
    let allImages: any[] = [];

    for (const dir of uploadDirs) {
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);
      
      for (const filename of files) {
        const filePath = path.join(dir, filename);
        const stats = fs.statSync(filePath);
        
        // Skip directories and non-image files
        if (stats.isDirectory() || !filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          continue;
        }

        try {
          const metadata = await sharp(filePath).metadata();
          
          // Check for variants
          const variantsDir = path.join(dir, 'variants');
          const hasVariants = fs.existsSync(variantsDir);
          
          const imageData = {
            id: filename.split('.')[0],
            filename,
            originalName: filename,
            filePath: `/${filePath.replace(/\\/g, '/')}`,
            url: `/${filePath.replace(/\\/g, '/')}`,
            thumbnailUrl: hasVariants 
              ? `/${path.join(variantsDir, `${filename.split('.')[0]}-thumbnail.webp`).replace(/\\/g, '/')}`
              : `/${filePath.replace(/\\/g, '/')}`,
            fileSize: stats.size,
            mimeType: `image/${metadata.format}`,
            width: metadata.width,
            height: metadata.height,
            altText: '', // Would come from database in real implementation
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
            
            // Enhanced URLs for different sizes
            urls: hasVariants ? {
              original: `/${filePath.replace(/\\/g, '/')}`,
              large: `/${path.join(variantsDir, `${filename.split('.')[0]}-large.webp`).replace(/\\/g, '/')}`,
              medium: `/${path.join(variantsDir, `${filename.split('.')[0]}-medium.webp`).replace(/\\/g, '/')}`,
              small: `/${path.join(variantsDir, `${filename.split('.')[0]}-small.webp`).replace(/\\/g, '/')}`,
              thumbnail: `/${path.join(variantsDir, `${filename.split('.')[0]}-thumbnail.webp`).replace(/\\/g, '/')}`
            } : undefined,

            // Processing info if variants exist
            processing: hasVariants ? {
              compressionRatio: '25%', // Mock data - would be calculated
              variantsCreated: 8,
              totalSize: Math.floor(stats.size * 0.75)
            } : undefined
          };

          allImages.push(imageData);
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
        }
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toString().toLowerCase();
      allImages = allImages.filter(img => 
        img.filename.toLowerCase().includes(searchLower) ||
        img.originalName.toLowerCase().includes(searchLower) ||
        (img.altText && img.altText.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'optimized') {
        allImages = allImages.filter(img => img.processing);
      } else if (filter === 'images') {
        allImages = allImages.filter(img => !img.processing);
      }
    }

    // Apply sorting
    allImages.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'size':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / limitNum);
    const paginatedImages = allImages.slice(offset, offset + limitNum);

    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalImages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      limit: limitNum
    };

    res.json({
      success: true,
      data: {
        images: paginatedImages,
        pagination
      }
    });
  } catch (error: any) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving images',
      error: error.message
    });
  }
};

// Check image references before deletion
export const checkImageReferences = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Security check
    if (!id || id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    // Here you would typically check database for references
    // For now, we'll simulate the check
    const mockReferences: Array<{
      type: 'article' | 'author' | 'category' | 'static-page';
      id: string;
      title: string;
      url?: string;
    }> = [
      // Example references - in real implementation, query your database
      // {
      //   type: 'article',
      //   id: 'article-123',
      //   title: 'Sample Article Title',
      //   url: '/articles/sample-article'
      // }
    ];

    const canDelete = mockReferences.length === 0;

    res.json({
      success: true,
      data: {
        references: mockReferences,
        canDelete,
        message: canDelete 
          ? 'Image can be safely deleted' 
          : `Image is referenced in ${mockReferences.length} item(s)`
      }
    });
  } catch (error: any) {
    console.error('Error checking image references:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking image references',
      error: error.message
    });
  }
};