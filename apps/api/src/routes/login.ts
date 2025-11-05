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

    console.log("=== LOGIN DEBUG START ===");
    console.log("User found:", user.email);
    console.log("User ID:", user._id);
    console.log("User role:", user.role);
    console.log("Profile completed:", user.profileCompleted);
    console.log("Raw disease fields from DB:", {
      diabetes: user.diabetes,
      hypertension: user.hypertension,
      cardiovascular: user.cardiovascular,
      selectedDiseases: user.selectedDiseases
    });

    // CRITICAL: Build selectedDiseases array from boolean fields
    // Always rebuild from booleans - don't trust the array
    const selectedDiseases: string[] = [];
    if (user.diabetes === true) {
      selectedDiseases.push("diabetes");
      console.log("✅ Diabetes: TRUE");
    }
    if (user.hypertension === true) {
      selectedDiseases.push("hypertension");
      console.log("✅ Hypertension: TRUE");
    }
    if (user.cardiovascular === true) {
      selectedDiseases.push("cardiovascular");
      console.log("✅ Cardiovascular: TRUE");
    }

    console.log("Computed selectedDiseases:", selectedDiseases);

    // Get user name - handle both naming conventions
    const userName = user.fullName || 
                     `${user.firstname || user.firstName || ''} ${user.lastname || user.lastName || ''}`.trim() ||
                     user.email;

    // Create JWT with role and diseases included
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: userName,
        role: user.role,
        disease: selectedDiseases,
        status: user.profileCompleted ? "complete" : "incomplete"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "24h" }
    );

    let redirectTo = "/dashboard"; // fallback
    let message = "";

    console.log("Determining redirect for role:", user.role);

    switch (user.role) {
      case "admin":
        redirectTo = "/admin";
        message = "Welcome Admin, you have full access.";
        console.log("➡️ Admin redirect:", redirectTo);
        break;

      case "doctor":
        redirectTo = "/caretaker";
        message = "Welcome Doctor, here are your patients.";
        console.log("➡️ Doctor redirect:", redirectTo);
        break;

      case "patient":
        console.log("Processing patient redirect...");
        
        // CRITICAL: Patients MUST complete profile first
        if (!user.profileCompleted) {
          redirectTo = "/profile";
          message = "Please complete your profile.";
          console.log("⚠️ Profile not completed -> /profile");
          
          if (user.isFirstLogin) {
            await User.findByIdAndUpdate(user._id, { isFirstLogin: false });
          }
        } 
        // CRITICAL: Patients with completed profile MUST have a disease
        else if (selectedDiseases.length === 0) {
          redirectTo = "/profile";
          message = "Please select at least one health condition.";
          console.log("⚠️ No diseases selected -> /profile");
        }
        
        else if (selectedDiseases.length === 1) {
          const primaryDisease = selectedDiseases[0];
          console.log("✅ Single disease:", primaryDisease);
          
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
              // Unknown disease name
              redirectTo = "/profile";
              message = "Please update your health profile.";
              console.log("⚠️ Unknown disease:", primaryDisease);
          }
          
          console.log("➡️ Disease page:", redirectTo);
        } 
        // Multiple diseases - let user choose
        else {
          redirectTo = "/select-disease";
          message = "Please select which condition to manage.";
          console.log("➡️ Multiple diseases -> /select-disease");
        }
        break;

      case "relative":
        redirectTo = "/relative/dashboard";
        message = "Welcome, here are your linked patients.";
        console.log("➡️ Relative redirect:", redirectTo);
        break;

      default:
        redirectTo = "/dashboard";
        message = "Welcome to SmartCare.";
        console.log("⚠️ Unknown role, using default:", redirectTo);
    }

    console.log("🎯 FINAL REDIRECT:", redirectTo);
    console.log("=== LOGIN DEBUG END ===\n");

    // Return safe user object (no password)
    const safeUser = {
      id: user._id,
      email: user.email,
      name: userName,
      role: user.role,
      profileCompleted: user.profileCompleted,
      selectedDiseases: selectedDiseases
    };

    res.status(200).json({
      user: safeUser,
      token,
      redirectTo,
      message,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;