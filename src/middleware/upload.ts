import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist with error handling
const uploadDirs = ['uploads/images', 'uploads/articles', 'uploads/authors', 'uploads/temp'];
uploadDirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.warn(`Failed to create upload directory ${dir}:`, error);
    // In production environments like Railway, we might not have write permissions
    // The application will still work, but file uploads will fail gracefully
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/images';
    
    // Determine upload path based on field name or route
    if (file.fieldname === 'featuredImage' || file.fieldname === 'gallery') {
      uploadPath = 'uploads/articles';
    } else if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/authors';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Middleware for single image upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Middleware for multiple image upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for mixed uploads (featured image + gallery)
export const uploadArticleImages = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// Middleware for author avatar
export const uploadAvatar = upload.single('avatar');

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.'
    });
  }
  
  next(error);
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};