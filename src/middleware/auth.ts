import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User } from '../models/User';
import { CustomError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        lastLogin?: Date;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded: JWTPayload = verifyToken(token);

    // Check token type
    if (decoded.tokenType !== 'access') {
      throw new CustomError('Invalid token type', 401);
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');

    if (!user) {
      throw new CustomError('User not found', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new CustomError('Account is deactivated', 401);
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (passwordChangedTimestamp > decoded.iat) {
        throw new CustomError('Password was changed. Please log in again.', 401);
      }
    }

    // Add user to request object
    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      lastLogin: user.lastLogin,
    };

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      next(error);
    } else {
      next(new CustomError('Invalid or expired token', 401));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError('Insufficient permissions', 403);
    }

    next();
  };
};

// Middleware specifically for admin routes
export const requireAdmin = authorize('admin');

// Middleware for admin and editor routes
export const requireEditor = authorize('admin', 'editor');

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded: JWTPayload = verifyToken(token);

      if (decoded.tokenType === 'access') {
        const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
        
        if (user && user.isActive) {
          req.user = {
            id: (user._id as any).toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            lastLogin: user.lastLogin,
          };
        }
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
};

// Aliases for backward compatibility
export const authenticateToken = authenticate;
export const requireRole = (roles: string[]) => authorize(...roles);