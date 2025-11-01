import app from './app';
import { config } from './config/config';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const port = process.env.PORT || config.port;
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Dominica News API running in ${config.nodeEnv} mode on port ${port}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('Unhandled Promise Rejection:', err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught Exception:', err.message);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();