// /routes/login.ts
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    await connectMongoDB();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT with role included
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "24h" }
    );

    let redirectTo = "/dashboard"; // default redirect
    let message = "";

    switch (user.role) {
      case "admin":
        redirectTo = "/admin";
        message = "Welcome Admin, you have full access.";
        break;

      case "doctor":
        redirectTo = "/doctors";
        message = "Welcome Doctor, here are your patients.";
        break;

      case "patient":
        // Only patients have profile logic
        if (!user.profileCompleted) {
          redirectTo = "/profile";
          message = "Please complete your profile.";
          if (user.isFirstLogin) {
            await User.findByIdAndUpdate(user._id, { isFirstLogin: false });
          }
        } else if (user.selectedDiseases?.length > 0) {
          if (user.selectedDiseases.length === 1) {
            const primaryDisease = user.selectedDiseases[0];
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
            }
          } else {
            redirectTo = "/select-disease";
            message = "Please select a disease dashboard.";
          }
        } else {
          redirectTo = "/dashboard";
          message = "Welcome to your health dashboard.";
        }
        break;

      case "relative":
        redirectTo = "/relative/dashboard";
        message = "Welcome, here are your linked patients.";
        break;

      default:
        redirectTo = "/dashboard";
        message = "Welcome to SmartCare.";
    }

    // Return safe user object (no password)
    const safeUser = {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    };

    res.status(200).json({
      user: safeUser,
      token,
      redirectTo,
      message,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
