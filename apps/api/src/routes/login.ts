import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";
import { emailService } from "../lib/emailService";

const router = express.Router();

// Main login route
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    await connectMongoDB();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log("=== LOGIN DEBUG START ===");
    console.log("User found:", user.email);
    console.log("User ID:", user._id);
    console.log("User role:", user.role);
    console.log("Profile completed:", user.profileCompleted);
    
    
    if (user.role === "relative") {
      
      if (!user.password || user.password === "temporary-password-needs-reset") {
        
        return res.status(401).json({ 
          message: "Please complete your account setup first. Check your email for the setup link.",
          needsSetup: true,
          role: "relative",
          email: user.email
        });
      }
      
      // Check if invitation is still pending
      if (user.invitationStatus === "pending") {
        
        return res.status(401).json({ 
          message: "Please complete your account setup via the link in your email.",
          needsSetup: true,
          role: "relative",
          email: user.email
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log("Raw disease fields from DB:", {
      diabetes: user.diabetes,
      hypertension: user.hypertension,
      cardiovascular: user.cardiovascular,
      selectedDiseases: user.selectedDiseases
    });

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
    const tokenPayload: any = {
      userId: user._id,
      email: user.email,
      name: userName,
      role: user.role,
      status: user.profileCompleted ? "complete" : "incomplete"
    };

    // Add disease info for patients only
    if (user.role === "patient") {
      tokenPayload.disease = selectedDiseases;
    }
    
    // Add relative-specific info
    if (user.role === "relative") {
      tokenPayload.accessLevel = user.accessLevel || "view_only";
      tokenPayload.relationship = user.relationshipToPatient;
    }

    const token = jwt.sign(
      tokenPayload,
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
        console.log("Processing relative redirect...");
        
        // ✅ RELATIVE LOGIC: Check if setup is complete
        if (!user.profileCompleted || user.invitationStatus === "pending") {
          redirectTo = "/relatives/setup";
          message = "Please complete your account setup.";
          console.log(" Relative setup incomplete -> /relative/setup");
        } else {
          redirectTo = "/relatives/dashboard";
          message = "Welcome, here are your linked patients.";
          console.log("➡️ Relative redirect:", redirectTo);
        }
        break;

      default:
        redirectTo = "/dashboard";
        message = "Welcome to SmartCare.";
        console.log("⚠️ Unknown role, using default:", redirectTo);
    }

    console.log("🎯 FINAL REDIRECT:", redirectTo);
    console.log("=== LOGIN DEBUG END ===\n");

    // Return safe user object (no password)
    const safeUser: any = {
      id: user._id,
      email: user.email,
      name: userName,
      role: user.role,
      profileCompleted: user.profileCompleted,
    };

    // Add role-specific fields
    if (user.role === "patient") {
      safeUser.selectedDiseases = selectedDiseases;
    }
    
    if (user.role === "relative") {
      safeUser.accessLevel = user.accessLevel;
      safeUser.relationship = user.relationshipToPatient;
      safeUser.invitationStatus = user.invitationStatus;
    }

    res.status(200).json({
      success: true,
      user: safeUser,
      token,
      redirectTo,
      message,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ✅ Helper endpoint for relatives who need setup
router.post("/relative-setup-help", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    await connectMongoDB();

    const user = await User.findOne({ 
      email, 
      role: "relative",
      invitationStatus: "pending"
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      return res.status(200).json({
        success: true,
        message: "If you have a pending invitation, a new setup link has been sent to your email."
      });
    }

    // Find associated patient
    const patient = await User.findById(user.monitoredPatient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Associated patient not found"
      });
    }

    // Generate new setup token
    const setupToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: "relative-setup",
        patientId: patient._id,
        patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        relativeName: `${user.firstName} ${user.lastName}`,
        relationship: user.relationshipToPatient,
        accessLevel: user.accessLevel || "view_only"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    // Update expiration
    user.invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    // Send email using your email service
    const emailSent = await emailService.sendRelativeInvitationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      patient.fullName || `${patient.firstName} ${patient.lastName}`,
      user.relationshipToPatient,
      setupToken,
      user.accessLevel || "view_only"
    );

    if (!emailSent) {
      console.error('❌ Failed to resend setup email');
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please contact support."
      });
    }

    res.status(200).json({
      success: true,
      message: "A new setup link has been sent to your email.",
      emailSent: true
    });

  } catch (error) {
    console.error("❌ Relative setup help error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;