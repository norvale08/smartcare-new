import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectMongoDB } from "../src/lib/mongodb";
import User from '../src/models/user';

dotenv.config();

async function seedAdmin() {
  await connectMongoDB();

  const email = "admin1@gmail.com";
  const password = "Admin123?";

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log("⚠️ Admin already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new User({
    firstName: "System",
    lastName: "Admin",
    email,
    password: hashedPassword,
    phoneNumber: +254791894370,
    role: "admin",
  });

  await admin.save();
  console.log("✅ Admin created:", email);

  process.exit(0);
}

seedAdmin();
