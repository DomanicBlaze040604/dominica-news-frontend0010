import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check if we can perform a simple database operation
    let dbOperational = false;
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbOperational = true;
      }
    } catch (error) {
      dbOperational = false;
    }

    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        operational: dbOperational
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };

    // Return 503 if database is not operational
    if (!dbOperational) {
      res.status(503).json({
        ...healthStatus,
        status: 'error',
        message: 'Database not operational'
      });
      return;
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness check endpoint
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if all required services are ready
    const dbReady = mongoose.connection.readyState === 1;
    
    if (!dbReady) {
      res.status(503).json({
        status: 'not ready',
        message: 'Database not ready'
      });
      return;
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      message: 'Readiness check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness check endpoint
router.get('/live', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;