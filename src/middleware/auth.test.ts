import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requireAdmin } from './auth';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { CustomError } from './errorHandler';

// Mock the User model
jest.mock('../models/User');
const MockedUser = User as jest.Mocked<typeof User>;

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const userPayload = {
        userId,
        email: 'admin@example.com',
        role: 'admin',
      };

      const token = generateToken(userPayload);
      req.headers = {
        authorization: `Bearer ${token}`,
      };

      const mockUser = {
        _id: userId,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      };

      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toEqual({
        id: userId,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401,
        })
      );
    });

    it('should reject request with invalid token format', async () => {
      req.headers = {
        authorization: 'InvalidToken',
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401,
        })
      );
    });

    it('should reject request with invalid token', async () => {
      req.headers = {
        authorization: 'Bearer invalid-token',
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
          statusCode: 401,
        })
      );
    });

    it('should reject request when user not found', async () => {
      const userPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: 'admin',
      };

      const token = generateToken(userPayload);
      req.headers = {
        authorization: `Bearer ${token}`,
      };

      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 401,
        })
      );
    });
  });

  describe('authorize', () => {
    it('should allow access for authorized role', () => {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      };

      const middleware = authorize('admin');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for unauthorized role', () => {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        fullName: 'Regular User',
        role: 'user',
      };

      const middleware = authorize('admin');

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow('Insufficient permissions');
    });

    it('should deny access when user not authenticated', () => {
      const middleware = authorize('admin');

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow('Authentication required');
    });

    it('should allow access for multiple authorized roles', () => {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        fullName: 'Regular User',
        role: 'user',
      };

      const middleware = authorize('admin', 'user');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin user', () => {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      };

      requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for non-admin user', () => {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        fullName: 'Regular User',
        role: 'user',
      };

      expect(() => {
        requireAdmin(req as Request, res as Response, next);
      }).toThrow('Insufficient permissions');
    });
  });
});