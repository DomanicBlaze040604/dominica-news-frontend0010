import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/dominica-news';

    if (!mongoURI) {
      throw new Error('❌ No MongoDB URI found in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Please check:');
    console.error('1️⃣ IP is whitelisted in MongoDB Atlas');
    console.error('2️⃣ MONGODB_URI is set correctly in Railway Variables');
    console.error('3️⃣ Network connection is stable');

    // ❗ Do not exit on Railway — just throw
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🛑 MongoDB Disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};
