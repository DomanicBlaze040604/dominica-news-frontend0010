import { Router, Request, Response } from 'express';
import errorTracker from '../services/errorTracker';
import logger from '../services/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Report error from frontend
router.post('/report', asyncHandler(async (req: Request, res: Response) => {
  const {
    message,
    stack,
    componentStack,
    timestamp,
    userAgent,
    url,
    userId,
    errorId,
    context
  } = req.body;

  try {
    // Create error object from frontend report
    const error = new Error(message);
    error.stack = stack;

    // Track the error
    const trackedErrorId = errorTracker.trackError(error, req, {
      ...context,
      userAgent,
      url,
      userId,
      frontendErrorId: errorId,
      componentStack,
      reportedAt: timestamp
    });

    // Log the frontend error
    logger.error(
      `Frontend error reported: ${message}`,
      error,
      logger.createRequestContext(req, {
        userAction: 'frontend_error_report',
        userId,
        url,
        userAgent
      }),
      {
        frontendErrorId: errorId,
        trackedErrorId,
        componentStack
      }
    );

    res.json({
      success: true,
      data: {
        errorId: trackedErrorId,
        message: 'Error report received and tracked'
      }
    });
  } catch (reportError) {
    logger.error('Failed to process error report', reportError as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
}));

// User-initiated error report
router.post('/user-report', asyncHandler(async (req: Request, res: Response) => {
  const {
    error,
    stack,
    componentStack,
    timestamp,
    userAgent,
    url,
    errorId,
    userDescription
  } = req.body;

  try {
    // Create error object
    const errorObj = new Error(error);
    errorObj.stack = stack;

    // Track the user-reported error
    const trackedErrorId = errorTracker.trackError(errorObj, req, {
      userAgent,
      url,
      userAction: 'user_error_report',
      frontendErrorId: errorId,
      componentStack,
      reportedAt: timestamp,
      userDescription
    });

    // Log the user report
    logger.info(
      `User reported error: ${error}`,
      logger.createRequestContext(req, {
        userAction: 'user_error_report'
      }),
      {
        frontendErrorId: errorId,
        trackedErrorId,
        userDescription,
        componentStack
      }
    );

    res.json({
      success: true,
      data: {
        errorId: trackedErrorId,
        message: 'Thank you for reporting this issue. Our team has been notified.'
      }
    });
  } catch (reportError) {
    logger.error('Failed to process user error report', reportError as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
}));

export { router as errorRoutes };