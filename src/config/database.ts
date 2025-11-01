import mongoose from 'mongoose';
import { config } from './config';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Please check:');
    console.error('1. Your IP is whitelisted in MongoDB Atlas');
    console.error('2. Your MongoDB connection string is correct');
    console.error('3. Your network connection is stable');
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};