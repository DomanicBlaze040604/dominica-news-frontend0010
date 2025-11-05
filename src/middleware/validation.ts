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
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
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

// Individual setting validation
export const validateIndividualSetting = [
  body('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isIn([
      'site_name', 'site_description', 'copyright_text', 'maintenance_mode', 'maintenance_message', 'logo',
      'social_facebook', 'social_twitter', 'social_instagram', 'social_youtube', 'social_linkedin', 'social_tiktok',
      'contact_email', 'contact_phone', 'contact_address', 'contact_workingHours',
      'seo_meta_title', 'seo_meta_description', 'seo_keywords', 'seo_og_image', 'seo_canonical_url'
    ])
    .withMessage('Invalid setting key'),
  body('value')
    .custom((value, { req }) => {
      const key = req.body.key;
      
      // Validate based on key type
      if (key === 'site_name' && (!value || value.length > 100)) {
        throw new Error('Site name must be between 1 and 100 characters');
      }
      if (key === 'site_description' && value && value.length > 500) {
        throw new Error('Site description cannot exceed 500 characters');
      }
      if (key === 'copyright_text' && value && value.length > 200) {
        throw new Error('Copyright text cannot exceed 200 characters');
      }
      if (key === 'maintenance_mode' && value !== 'true' && value !== 'false') {
        throw new Error('Maintenance mode must be true or false');
      }
      if (key === 'maintenance_message' && value && value.length > 500) {
        throw new Error('Maintenance message cannot exceed 500 characters');
      }
      if (key.startsWith('social_') && value && !isURL(value)) {
        throw new Error('Social media URL must be valid');
      }
      if (key === 'contact_email' && value && !isEmail(value)) {
        throw new Error('Contact email must be valid');
      }
      if (key === 'contact_phone' && value && value.length > 20) {
        throw new Error('Phone number cannot exceed 20 characters');
      }
      if (key === 'seo_meta_title' && value && value.length > 60) {
        throw new Error('Meta title cannot exceed 60 characters');
      }
      if (key === 'seo_meta_description' && value && value.length > 160) {
        throw new Error('Meta description cannot exceed 160 characters');
      }
      if (key === 'seo_og_image' && value && !isURL(value)) {
        throw new Error('Open Graph image must be a valid URL');
      }
      if (key === 'seo_canonical_url' && value && !isURL(value)) {
        throw new Error('Canonical URL must be a valid URL');
      }
      
      return true;
    }),
];

// Helper functions for validation
function isURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isEmail(str: string): boolean {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(str);
}

// Contact form validation
export const validateContactForm = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

// Static page validation
export const validateStaticPage = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Page title must be between 2 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Page content must be at least 10 characters long'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('keywords.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each keyword must be between 1 and 50 characters'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('Published status must be true or false'),
  body('showInMenu')
    .optional()
    .isBoolean()
    .withMessage('Show in menu must be true or false'),
  body('menuOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Menu order must be a non-negative integer'),
  body('template')
    .optional()
    .isIn(['default', 'about', 'contact', 'privacy', 'terms'])
    .withMessage('Template must be one of: default, about, contact, privacy, terms'),
];