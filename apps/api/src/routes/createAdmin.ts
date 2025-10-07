import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Simple secret key check for initial setup (change this in production)
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || "change-me-in-production";

router.post("/", async (req, res) => {
  try {
    const { secret, firstName, lastName, email, phoneNumber, password } = req.body;

    if (secret !== ADMIN_SETUP_SECRET) {
      return res.status(403).json({ message: "Invalid secret key" });
    }

    await connectMongoDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists. Setup complete." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "admin",
      profileCompleted: true, // Admin profile is complete
    });

    await adminUser.save();

    res.status(201).json({ 
      message: "Admin user created successfully",
      user: {
        id: adminUser._id,
        email: adminUser.email,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        role: adminUser.role,
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error during admin creation" });
  }
});

export default router;
