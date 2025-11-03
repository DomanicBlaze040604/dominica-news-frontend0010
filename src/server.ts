import app from './app';
import { config } from './config/config';
import { connectDatabase } from './config/database';
import { User } from './models/User';
import bcrypt from 'bcryptjs';

const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Dominica News backend server...');

    // ✅ Connect to MongoDB
    await connectDatabase();
    console.log('✅ Database connection established.');

    // ✅ Seed admin user if not exists
    await seedAdmin();

    // ✅ Determine the port (Railway auto-assigns PORT)
    const port: number = Number(process.env.PORT) || Number(config.port) || 8080;

    // ✅ Start the Express server
    const server = app.listen(port, () => {
      console.log(`🚀 Dominica News API running in ${config.nodeEnv} mode on port ${port}`);
    });

    // ✅ Handle graceful shutdown signals
    const gracefulShutdown = (signal: string) => {
      console.log(`⚠️ Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('🛑 Server closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ✅ Handle uncaught errors properly
    process.on('unhandledRejection', (err: any) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('🚨 Failed to start server:', error instanceof Error ? error.message : error);
    console.error('💡 Check if MONGODB_URI is valid and network access is open.');
    process.exit(1);
  }
};

// ✅ Function to seed an admin user if not exists
async function seedAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️ Admin credentials not found in environment variables. Skipping admin seeding.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('👤 Admin user already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      fullName: 'Super Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin user created successfully.');
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
  }
}

startServer();
