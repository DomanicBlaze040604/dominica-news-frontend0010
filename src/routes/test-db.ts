import { Router } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/config';

const router = Router();

router.get('/connection', async (req, res) => {
  try {
    // Test direct connection
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Try to connect if not connected
    if (connectionState === 0) {
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
    }

    res.json({
      success: true,
      connectionState: states[connectionState as keyof typeof states],
      mongoUri: config.mongodbUri ? 'Set' : 'Not Set',
      mongoUriLength: config.mongodbUri?.length || 0,
      nodeEnv: config.nodeEnv,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionState: mongoose.connection.readyState,
      mongoUri: config.mongodbUri ? 'Set' : 'Not Set',
      nodeEnv: config.nodeEnv
    });
  }
});

export { router as testDbRoutes };