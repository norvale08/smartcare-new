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

    // Debug logs
    console.log("=== LOGIN DEBUG INFO ===");
    console.log("User email:", user.email);
    console.log("User role:", user.role);
    console.log("Is first login:", user.isFirstLogin);
    console.log("Profile completed:", user.profileCompleted);
    console.log("Selected diseases:", user.selectedDiseases);

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        status: user.profileCompleted ? 'complete' : 'incomplete',
        disease: user.selectedDiseases || [],
        isFirstLogin: user.isFirstLogin
      },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '24h' }
    );

    let redirectTo = "/dashboard"; // default
    let message = "";

    // 🔥 Profile incomplete → force profile setup (but not for admin or doctor)
    if (!user.profileCompleted && user.role !== 'admin' && user.role !== 'doctor') {
      redirectTo = "/profile";
      message = "Please complete your profile.";
      if (user.isFirstLogin) {
        await User.findByIdAndUpdate(user._id, { isFirstLogin: false });
        console.log("✅ Updated isFirstLogin to false");
      }
    } 
    // Admin role - direct to admin dashboard (overrides other logic)
    else if (user.role === 'admin') {
      redirectTo = "/admin";
      message = "Welcome to the admin dashboard.";
      console.log("🔄 Admin detected, redirecting to /admin");
    }
    // Doctor role - direct to doctors dashboard
    else if (user.role === 'doctor') {
      redirectTo = "/doctors";
      message = "Welcome to your doctor dashboard.";
      console.log("🔄 Doctor detected, redirecting to /doctors");
    }
    // ✅ Profile complete + diseases selected (for non-admin)
    else if (user.selectedDiseases?.length > 0) {
      if (user.selectedDiseases.length === 1) {
        // Single disease → go straight to dashboard
        const primaryDisease = user.selectedDiseases[0];
        console.log("🔄 Redirecting based on disease:", primaryDisease);

        switch (primaryDisease) {
          case "diabetes":
            redirectTo = "/diabetes";
            message = "Welcome to your diabetes management dashboard.";
            break;
          case "hypertension":
            redirectTo = "/hypertension";
            message = "Welcome to your hypertension management dashboard.";
            break;
          case "cardiovascular":
            redirectTo = "/cardiovascular";
            message = "Welcome to your cardiovascular health dashboard.";
            break;
          default:
            redirectTo = "/dashboard";
            message = "Welcome to your health dashboard.";
            console.log("❌ Disease not matched, using general dashboard. Disease:", `"${primaryDisease}"`);
        }
      } else {
        // Multiple diseases → show selector page
        redirectTo = "/select-disease";
        message = "Please select a disease dashboard.";
        console.log("🔄 Multiple diseases, redirecting to selector.");
      }
    } 
    // ✅ Profile complete but no disease (for non-admin)
    else {
      redirectTo = "/dashboard";
      message = "Welcome to your health dashboard.";
      console.log("🔄 Redirect reason: Profile completed but no diseases selected");
    }

    console.log("Final redirect destination:", redirectTo);
    console.log("Message:", message);
    console.log("========================");

    const safeUser = {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      isFirstLogin: false, // Always false after first login
      profileCompleted: user.profileCompleted,
      selectedDiseases: user.selectedDiseases || []
    };

    res.status(200).json({
      user: safeUser,
      token: token,
      redirectTo: redirectTo,
      message: message
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
