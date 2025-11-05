#!/usr/bin/env node

/**
 * Production startup script for Dominica News Backend
 * Handles environment setup and graceful error handling
 */

const path = require('path');
const fs = require('fs');

// Set production environment
process.env.NODE_ENV = 'production';

// Load production environment variables if available
const prodEnvPath = path.join(__dirname, '.env.production');
if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
}

// Set production-friendly defaults
process.env.ENABLE_FILE_LOGGING = process.env.ENABLE_FILE_LOGGING || 'false';
process.env.ENABLE_CONSOLE_LOGGING = process.env.ENABLE_CONSOLE_LOGGING || 'true';
process.env.LOG_DIRECTORY = process.env.LOG_DIRECTORY || '/tmp/logs';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
console.log('Starting Dominica News Backend in production mode...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3001,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ENABLE_FILE_LOGGING: process.env.ENABLE_FILE_LOGGING,
  LOG_DIRECTORY: process.env.LOG_DIRECTORY
});

// Import and start the server
require('./dist/server.js');