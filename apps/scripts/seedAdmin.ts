import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// ✅ Load environment variables
dotenv.config({ path: './apps/api/.env' });

import { connectMongoDB } from '../api/src/lib/mongodb';
import User from '../api/src/models/user';

const SEED_ADMIN_EMAIL = 'admin@smartcare.com';
const SEED_ADMIN_PASSWORD = 'Admin123*';
const SEED_ADMIN_FIRSTNAME = 'Admin';
const SEED_ADMIN_LASTNAME = 'User';

async function seedAdmin() {
  try {
    await connectMongoDB();
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

    const adminUser = new User({
      firstName: SEED_ADMIN_FIRSTNAME,
      lastName: SEED_ADMIN_LASTNAME,
      email: SEED_ADMIN_EMAIL,
      phoneNumber: '1234567890',
      password: hashedPassword,
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${SEED_ADMIN_EMAIL}`);
    console.log(`Password: ${SEED_ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

seedAdmin();
