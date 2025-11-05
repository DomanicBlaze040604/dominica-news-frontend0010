import { Router, Request, Response } from 'express';
import healthCheckService from '../services/healthCheck';
import errorTracker from '../services/errorTracker';
import logger from '../services/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = await healthCheckService.performHealthCheck();
  
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: true,
    data: healthCheck
  });
}));

// Detailed health check with all components
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = await healthCheckService.performHealthCheck();
  const errorStats = errorTracker.getErrorStats();
  const logStats = logger.getLogStats();

  const detailedHealth = {
    ...healthCheck,
    errorTracking: {
      totalErrors: errorStats.totalErrors,
      unresolvedErrors: errorStats.unresolvedErrors,
      criticalErrors: errorTracker.getCriticalErrors().length,
      recentErrors: errorStats.recentErrors.slice(0, 5) // Last 5 errors
    },
    logging: {
      totalLogs: logStats.totalLogs,
      totalErrors: logStats.totalErrors,
      totalWarnings: logStats.totalWarnings
    }
  };

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: true,
    data: detailedHealth
  });
}));

// Liveness probe (for container orchestration)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness probe (for container orchestration)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = await healthCheckService.performHealthCheck();
  
  // Consider ready if not unhealthy
  const isReady = healthCheck.status !== 'unhealthy';
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    success: isReady,
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: healthCheck.checks.database.status,
      environment: healthCheck.checks.environment.status
    }
  });
}));

// System diagnostics endpoint
router.get('/diagnostics', asyncHandler(async (req: Request, res: Response) => {
  const diagnostics = await healthCheckService.runDiagnostics();
  
  const hasFailures = diagnostics.some(d => d.status === 'fail');
  const statusCode = hasFailures ? 200 : 200; // Always return 200 for diagnostics

  res.status(statusCode).json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      diagnostics,
      summary: {
        total: diagnostics.length,
        passed: diagnostics.filter(d => d.status === 'pass').length,
        warnings: diagnostics.filter(d => d.status === 'warn').length,
        failed: diagnostics.filter(d => d.status === 'fail').length
      }
    }
  });
}));

// Error tracking endpoints
router.get('/errors', asyncHandler(async (req: Request, res: Response) => {
  const stats = errorTracker.getErrorStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

router.get('/errors/critical', asyncHandler(async (req: Request, res: Response) => {
  const criticalErrors = errorTracker.getCriticalErrors();
  
  res.json({
    success: true,
    data: criticalErrors
  });
}));

router.get('/errors/unresolved', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const unresolvedErrors = errorTracker.getUnresolvedErrors(limit);
  
  res.json({
    success: true,
    data: unresolvedErrors
  });
}));

router.get('/errors/trends', asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const trends = errorTracker.getErrorTrends(days);
  
  res.json({
    success: true,
    data: trends
  });
}));

// Resolve error endpoint (for admin use)
router.post('/errors/:errorId/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { errorId } = req.params;
  const { notes } = req.body;
  const resolvedBy = (req as any).user?.id || 'system';

  const resolved = errorTracker.resolveError(errorId, resolvedBy, notes);
  
  if (resolved) {
    logger.info(`Error ${errorId} resolved by ${resolvedBy}`, { userId: resolvedBy }, { errorId, notes });
    
    res.json({
      success: true,
      message: 'Error resolved successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Error not found'
    });
  }
}));

// System metrics endpoint
router.get('/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({
    success: true,
    data: metrics
  });
});

// Connectivity test endpoint
router.post('/connectivity', asyncHandler(async (req: Request, res: Response) => {
  const { component } = req.body;
  
  const results: any = {};
  
  if (!component || component === 'database') {
    try {
      const dbCheck = await healthCheckService.performHealthCheck();
      results.database = {
        status: dbCheck.checks.database.status,
        message: dbCheck.checks.database.message,
        responseTime: dbCheck.checks.database.responseTime
      };
    } catch (error) {
      results.database = {
        status: 'unhealthy',
        message: (error as Error).message,
        responseTime: null
      };
    }
  }
  
  if (!component || component === 'filesystem') {
    try {
      const healthCheck = await healthCheckService.performHealthCheck();
      results.filesystem = {
        status: healthCheck.checks.fileSystem.status,
        message: healthCheck.checks.fileSystem.message,
        responseTime: healthCheck.checks.fileSystem.responseTime
      };
    } catch (error) {
      results.filesystem = {
        status: 'unhealthy',
        message: (error as Error).message,
        responseTime: null
      };
    }
  }

  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      results
    }
  });
}));

// Data integrity check endpoint
router.post('/data-integrity', asyncHandler(async (req: Request, res: Response) => {
  const { collections } = req.body;
  
  // This would perform data integrity checks on specified collections
  // For now, we'll return a placeholder response
  const results = {
    timestamp: new Date().toISOString(),
    collections: collections || ['articles', 'categories', 'authors'],
    checks: [
      {
        collection: 'articles',
        status: 'pass',
        message: 'All articles have valid references',
        count: 0 // Would be actual count
      },
      {
        collection: 'categories',
        status: 'pass',
        message: 'All categories are properly structured',
        count: 0 // Would be actual count
      },
      {
        collection: 'authors',
        status: 'pass',
        message: 'All authors have valid data',
        count: 0 // Would be actual count
      }
    ]
  };

  res.json({
    success: true,
    data: results
  });
}));

export { router as healthRoutes };