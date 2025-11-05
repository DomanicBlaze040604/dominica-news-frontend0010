import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';
import errorTracker from '../services/errorTracker';

export class CustomError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Determine status code
  let statusCode = error.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { ...error, message, statusCode: 404 };
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { ...error, message, statusCode: 400 };
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { ...error, message, statusCode: 400 };
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { ...error, message, statusCode: 401 };
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { ...error, message, statusCode: 401 };
    statusCode = 401;
  }

  // Track the error
  const errorId = errorTracker.trackError(err, req, { statusCode });

  // Log the error with context
  const context = logger.createRequestContext(req, { 
    statusCode,
    errorId,
    userAction: 'error_occurred'
  });

  logger.error(
    `${err.name}: ${error.message}`,
    err,
    context,
    { 
      errorId,
      isOperational: error.isOperational,
      originalError: err.name
    }
  );

  // Prepare user-friendly error message
  let userMessage = error.message || 'Server Error';
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    userMessage = 'Internal Server Error';
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: userMessage,
    errorId: errorId
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      originalMessage: err.message
    };
  }

  res.status(statusCode).json(errorResponse);
};

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  next();
};

export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = logger.createRequestContext(req, { userAction: action });
    logger.logUserAction(action, req, {
      timestamp: new Date().toISOString(),
      success: true
    });
    next();
  };
};