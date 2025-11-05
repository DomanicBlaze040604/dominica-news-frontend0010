import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import { asyncHandler } from './errorHandler';

/**
 * Middleware to check if the site is in maintenance mode
 * Allows admin users to bypass maintenance mode
 */
export const checkMaintenanceMode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Skip maintenance check for admin routes and auth routes
  if (req.path.startsWith('/api/admin') || 
      req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/health') ||
      req.path === '/api/settings' ||
      req.path.startsWith('/api/settings/')) {
    return next();
  }

  try {
    const settings = await Settings.findOne();
    
    if (settings && settings.maintenanceMode) {
      // Check if user is authenticated as admin
      const token = req.headers.authorization?.replace('Bearer ', '');
      let isAdmin = false;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          isAdmin = decoded.role === 'admin';
        } catch (error) {
          // Token is invalid, user is not admin
          isAdmin = false;
        }
      }

      // If not admin, return maintenance mode response
      if (!isAdmin) {
        const maintenanceMessage = (settings as any).maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.';
        
        return res.status(503).json({
          success: false,
          message: 'Site is currently under maintenance',
          maintenanceMode: true,
          data: {
            title: 'Site Under Maintenance',
            message: maintenanceMessage,
            estimatedTime: 'We expect to be back online shortly.',
            contactEmail: settings.contactInfo?.email || 'support@dominicanews.com'
          }
        });
      }
    }

    next();
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request to proceed
    console.error('Error checking maintenance mode:', error);
    next();
  }
});

/**
 * Get maintenance mode status (public endpoint)
 */
export const getMaintenanceStatus = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne();
  
  res.json({
    success: true,
    data: {
      maintenanceMode: settings?.maintenanceMode || false,
      message: settings?.maintenanceMode ? 'Site is currently under maintenance' : 'Site is operational'
    }
  });
});