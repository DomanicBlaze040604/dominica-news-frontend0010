import { body, param, query } from 'express-validator';

// User validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Category validation
export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, ampersands, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description cannot exceed 500 characters'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];

// Article validation
export const validateArticle = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Article title must be between 5 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Article content must be at least 50 characters long'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Article excerpt cannot exceed 500 characters'),
  body('category')
    .isMongoId()
    .withMessage('Please provide a valid category ID'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName: string = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Search validation
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(), // Prevent XSS
];

// File upload validation
export const validateImageUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Please upload an image file');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }
      
      // Check file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }
      
      return true;
    }),
];

// Sanitization helpers
export const sanitizeHtml = (field: string) => [
  body(field)
    .customSanitizer((value) => {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      if (typeof value === 'string') {
        return value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/javascript:/gi, '');
      }
      return value;
    }),
];

// Rate limiting validation
export const validateRateLimit = [
  body('*')
    .custom((value, { req }) => {
      // Check if request is coming too frequently from same IP
      const userRequests = (global as any).userRequests || {};
      const clientIP = req.ip;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 10;
      
      if (!userRequests[clientIP]) {
        userRequests[clientIP] = [];
      }
      
      // Remove old requests outside the window
      userRequests[clientIP] = userRequests[clientIP].filter(
        (timestamp: number) => now - timestamp < windowMs
      );
      
      if (userRequests[clientIP].length >= maxRequests) {
        throw new Error('Too many requests, please try again later');
      }
      
      userRequests[clientIP].push(now);
      (global as any).userRequests = userRequests;
      
      return true;
    }),
];
// Settings validation
export const validateSettings = [
  body('siteName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Site name must be between 1 and 100 characters'),
  body('siteDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Site description cannot exceed 500 characters'),
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  body('socialMedia.youtube')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be valid'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be valid'),
  body('contactInfo.phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('maintenanceMode')
    .optional()
    .isBoolean()
    .withMessage('Maintenance mode must be true or false'),
];