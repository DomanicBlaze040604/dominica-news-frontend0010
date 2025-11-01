import { Request, Response, NextFunction } from 'express';
import { ValidationError, validationResult } from 'express-validator';
import mongoose from 'mongoose';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error with more details
  console.error(`Error ${err.statusCode || 500}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
    console.error('Request details:', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const castError = err as mongoose.CastError;
    const message = `Invalid ${castError.path}: ${castError.value}`;
    error = new CustomError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const duplicateField = Object.keys((err as any).keyValue)[0];
    const message = `${duplicateField} already exists`;
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationError = err as mongoose.Error.ValidationError;
    const messages = Object.values(validationError.errors).map((error) => {
      if (error instanceof mongoose.Error.ValidatorError) {
        return error.message;
      }
      return error.message;
    });
    error = new CustomError(messages.join('. '), 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new CustomError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = new CustomError(message, 401);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerError = err as any;
    let message = 'File upload error';
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = multerError.message || 'File upload error';
    }
    
    error = new CustomError(message, 400);
  }

  // Rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    error = new CustomError('Too many requests, please try again later', 429);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: {
        name: err.name,
        originalMessage: err.message
      }
    }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Validation middleware to handle express-validator errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => {
      if (error.type === 'field') {
        return `${error.path}: ${error.msg}`;
      }
      return error.msg;
    });
    
    const error = new CustomError(errorMessages.join('. '), 400);
    return next(error);
  }
  
  next();
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Audit logging middleware for admin actions
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful admin actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user = (req as any).user;
        const logData = {
          timestamp: new Date().toISOString(),
          action,
          user: user ? { id: user.id, email: user.email } : 'Unknown',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          body: req.method !== 'GET' ? req.body : undefined,
          statusCode: res.statusCode
        };
        
        console.log('AUDIT LOG:', JSON.stringify(logData, null, 2));
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};