import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add to request object
  req.requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};