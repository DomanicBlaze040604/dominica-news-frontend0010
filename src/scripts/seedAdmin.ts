/**
 * One-Time Admin Seeder Script
 * ---------------------------------
 * Creates an admin account using credentials from .env
 * Run this once after deploying backend:
 *
 *   👉  npx ts-node src/scripts/seedAdmin.ts
 */

import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  try {
    await connectDatabase();

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const adminName = process.env.ADMIN_NAME || 'Dominica Admin';

    if (!adminEmail || !adminPassword) {
      console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
      process.exit(1);
    }

    // 🔍 Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`✅ Upgraded existing user (${adminEmail}) to admin.`);
      } else {
        console.log('ℹ️ Admin already exists. Skipping creation.');
      }
      process.exit(0);
    }

    // 🧩 Create new admin
    const newAdmin = new User({
      email: adminEmail,
      password: adminPassword, // handled by pre-save middleware
      fullName: adminName,
      role: 'admin',
    });

    await newAdmin.save();
    console.log(`✅ Admin user created successfully: ${adminEmail}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
