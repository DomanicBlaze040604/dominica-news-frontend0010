import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  contentLength?: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  requestId: string;
  timestamp: Date;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Override res.end to capture response details
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    const contentLength = res.get('Content-Length');

    const logData: RequestLogData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: contentLength ? parseInt(contentLength) : undefined,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userId: (req as any).user?.id,
      requestId: req.requestId,
      timestamp
    };

    // Log based on status code
    const context = logger.createRequestContext(req, {
      responseTime,
      statusCode: res.statusCode
    });

    if (res.statusCode >= 500) {
      logger.error(
        `${req.method} ${req.originalUrl} - ${res.statusCode}`,
        undefined,
        context,
        logData
      );
    } else if (res.statusCode >= 400) {
      logger.warn(
        `${req.method} ${req.originalUrl} - ${res.statusCode}`,
        context,
        logData
      );
    } else if (req.originalUrl.includes('/api/')) {
      // Only log API requests at info level to reduce noise
      logger.info(
        `${req.method} ${req.originalUrl} - ${res.statusCode}`,
        context,
        logData
      );
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };

  // Override res.json to capture JSON responses
  res.json = function(body?: any) {
    // Log response body for errors (but not sensitive data)
    if (res.statusCode >= 400 && body && typeof body === 'object') {
      const context = logger.createRequestContext(req);
      logger.debug(
        `Response body for ${req.method} ${req.originalUrl}`,
        context,
        { 
          responseBody: body,
          statusCode: res.statusCode
        }
      );
    }

    return originalJson.call(this, body);
  };

  next();
};

// Middleware to log slow requests
export const slowRequestLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > threshold) {
        const context = logger.createRequestContext(req, {
          responseTime,
          statusCode: res.statusCode,
          threshold
        });

        logger.warn(
          `Slow request detected: ${req.method} ${req.originalUrl}`,
          context,
          {
            responseTime,
            threshold,
            performance: 'slow'
          }
        );
      }
    });

    next();
  };
};

// Middleware to log database operations
export const dbOperationLogger = (operation: string, collection: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = logger.createRequestContext(req, {
      userAction: `db_${operation}`,
      collection
    });

    logger.debug(
      `Database operation: ${operation} on ${collection}`,
      context,
      {
        operation,
        collection,
        timestamp: new Date().toISOString()
      }
    );

    next();
  };
};