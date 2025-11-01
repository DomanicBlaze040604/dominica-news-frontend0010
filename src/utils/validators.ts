import { body } from 'express-validator';

export const registerValidation = [
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

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
  
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

export const categoryUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
  
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

export const articleValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Article title must be between 5 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-.,!?'"&()]+$/)
    .withMessage('Article title contains invalid characters'),
  
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Article excerpt cannot exceed 500 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Article content must be at least 50 characters long'),
  
  body('featuredImage')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true; // Allow empty string
      }
      // Check if it's a valid URL
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Featured image must be a valid URL');
      }
    }),
  
  body('categoryId')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either "draft" or "published"'),
];

export const articleUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Article title must be between 5 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-.,!?'"&()]+$/)
    .withMessage('Article title contains invalid characters'),
  
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Article excerpt cannot exceed 500 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Article content must be at least 50 characters long'),
  
  body('featuredImage')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true; // Allow empty string
      }
      // Check if it's a valid URL
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Featured image must be a valid URL');
      }
    }),
  
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either "draft" or "published"'),
];