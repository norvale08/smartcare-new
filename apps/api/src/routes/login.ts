// /routes/login.ts
import express from 'express';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from '../models/user';
import { connectMongoDB } from '../lib/mongodb';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    await connectMongoDB();

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // 🔍 DEBUG: Log user data before redirect logic
    console.log("=== LOGIN DEBUG INFO ===");
    console.log("User email:", user.email);
    console.log("Profile completed:", user.profileCompleted);
    console.log("Selected diseases:", user.selectedDiseases);
    console.log("Selected diseases type:", typeof user.selectedDiseases);
    console.log("Selected diseases length:", user.selectedDiseases ? user.selectedDiseases.length : "null/undefined");
    if (user.selectedDiseases && user.selectedDiseases.length > 0) {
      console.log("First disease:", user.selectedDiseases[0]);
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        status: user.profileCompleted ? 'complete' : 'incomplete',
        disease: user.selectedDiseases || [],
      },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '24h' }
    );

    let redirectTo = "/profile"; // default for incomplete profiles

    if (!user.profileCompleted) {
      redirectTo = "/profile";
      console.log("🔄 Redirect reason: Profile not completed");
    } else if (user.selectedDiseases && user.selectedDiseases.length > 0) {
      const disease = user.selectedDiseases[0];
      console.log("🔄 Checking disease for redirect:", disease);
      
      if (disease === "diabetes") {
        redirectTo = "/diabetes";
        console.log("✅ Redirecting to diabetes dashboard");
      } else if (disease === "hypertension") {
        redirectTo = "/hypertension";
        console.log("✅ Redirecting to hypertension dashboard");
      } else if (disease === "cardiovascular") {
        redirectTo = "/cardiovascular";
        console.log("✅ Redirecting to cardiovascular dashboard");
      } else {
        console.log("❌ Disease not matched, staying at profile. Disease value:", `"${disease}"`);
      }
    } else {
      // Profile completed but no diseases selected - maybe a fallback route?
      redirectTo = "/dashboard";
      console.log("🔄 Redirect reason: Profile completed but no diseases selected");
    }

    console.log("Final redirect destination:", redirectTo);
    console.log("========================");

    const safeUser = {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      isFirstLogin: user.isFirstLogin,
      profileCompleted: user.profileCompleted,
      selectedDiseases: user.selectedDiseases || []
    };

    res.status(200).json({
      user: safeUser,
      token: token,
      redirectTo: redirectTo
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;