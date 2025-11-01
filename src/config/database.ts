import mongoose from 'mongoose';
import { config } from './config';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Please check:');
    console.error('1. Your IP is whitelisted in MongoDB Atlas');
    console.error('2. Your MongoDB connection string is correct');
    console.error('3. Your network connection is stable');
    process.exit(1);
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