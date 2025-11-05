import dotenv from 'dotenv';
import app from './app';
import { config } from './config/config';
import { connectDatabase } from './config/database';
import { User } from './models/User';
import bcrypt from 'bcryptjs';
import { settingsRoutes } from './routes/settings'; // ✅ Import the settings route

// -----------------------------------------------------------------------------
// 🌍 Load environment variables
// -----------------------------------------------------------------------------
dotenv.config();

// -----------------------------------------------------------------------------
// 🚀 Start Server Function
// -----------------------------------------------------------------------------
const startServer = async (): Promise<void> => {
  try {
    console.log('\n=========================================');
    console.log('🌎 Starting Dominica News Backend Server');
    console.log('=========================================\n');

    // ✅ Connect to MongoDB
    await connectDatabase();
    console.log('✅ MongoDB connection established successfully.');

    // ✅ Add Settings Route (must be before 404 fallback)
    app.use('/api/settings', settingsRoutes);

    // ✅ Seed the admin account (idempotent)
    await seedAdmin();

    // ✅ Railway-compatible port binding
    const port = Number(process.env.PORT) || Number(config.port) || 8080;
    const host = '0.0.0.0';

    const server = app.listen(port, host, () => {
      console.log(`✅ Dominica News API running in ${config.nodeEnv || 'development'} mode`);
      console.log(`🌐 Listening on: http://${host}:${port}`);
      console.log(`🧭 Domain: https://dominicanews.dm\n`);
    });

    // -------------------------------------------------------------------------
    // 🧹 Graceful Shutdown Handlers
    // -------------------------------------------------------------------------
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️ Received ${signal}. Cleaning up...`);
      server.close(() => {
        console.log('🛑 Server closed gracefully. Goodbye 👋');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // -------------------------------------------------------------------------
    // 🚨 Global Error Safety Nets
    // -------------------------------------------------------------------------
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('🔥 Uncaught Exception:', error.message);
      console.error(error.stack);
      process.exit(1);
    });

  } catch (error: any) {
    console.error('🚨 Server startup failed:', error.message || error);
    console.error('💡 Check if MONGODB_URI and PORT are correctly set.');
    process.exit(1);
  }
};

// -----------------------------------------------------------------------------
// 👑 Seed Super Admin (safe & idempotent)
// -----------------------------------------------------------------------------
async function seedAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env. Skipping seeding.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`👤 Admin already exists (${adminEmail}).`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.create({
      fullName: 'Super Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin user seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
  }
}

startServer();
