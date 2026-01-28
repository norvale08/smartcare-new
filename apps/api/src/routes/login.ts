import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";
import { emailService } from "../lib/emailService";

const router = express.Router();

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";
const JWT_EXPIRY = "24h";
const SETUP_TOKEN_EXPIRY = "7d";

// Type definitions
interface UserDocument {
  _id: any;
  email: string;
  password: string;
  role: string;
  fullName?: string;
  firstname?: string;
  firstName?: string;
  lastname?: string;
  lastName?: string;
  profileCompleted: boolean;
  isFirstLogin?: boolean;
  diabetes?: boolean;
  hypertension?: boolean;
  cardiovascular?: boolean;
  selectedDiseases?: string[];
  accessLevel?: string;
  relationshipToPatient?: string;
  invitationStatus?: string;
  monitoredPatient?: any;
  invitationExpires?: Date;
  isApproved?: boolean; // ✅ Added for approval functionality
}

interface RedirectResult {
  redirectTo: string;
  message: string;
}

// Helper: Extract user's diseases
const extractDiseases = (user: UserDocument): string[] => {
  const diseases: string[] = [];
  if (user.diabetes === true) diseases.push("diabetes");
  if (user.hypertension === true) diseases.push("hypertension");
  if (user.cardiovascular === true) diseases.push("cardiovascular");
  return diseases;
};

// Helper: Get user display name
const getUserName = (user: UserDocument): string => {
  return user.fullName || 
         `${user.firstname || user.firstName || ''} ${user.lastname || user.lastName || ''}`.trim() ||
         user.email;
};

// Helper: Determine patient redirect
const getPatientRedirect = (user: UserDocument, diseases: string[]): RedirectResult => {
  if (!user.profileCompleted) {
    return {
      redirectTo: "/profile",
      message: "Please complete your profile."
    };
  }

  if (diseases.length === 0) {
    return {
      redirectTo: "/profile",
      message: "Please select at least one health condition."
    };
  }

  // If user has both diabetes and hypertension, always redirect to /diabetes
  // The diabetes page will handle both conditions together
  if (diseases.includes("diabetes") && diseases.includes("hypertension")) {
    return {
      redirectTo: "/diabetes",
      message: "Welcome to your diabetes and hypertension management dashboard."
    };
  }

  // If user has diabetes (alone), redirect to diabetes
  if (diseases.includes("diabetes")) {
    return {
      redirectTo: "/diabetes",
      message: "Welcome to your diabetes management dashboard."
    };
  }

  // Single condition handling for other diseases
  if (diseases.length === 1) {
    const diseaseRoutes: Record<string, RedirectResult> = {
      hypertension: {
        redirectTo: "/hypertension",
        message: "Welcome to your hypertension management dashboard."
      },
      cardiovascular: {
        redirectTo: "/cardiovascular",
        message: "Welcome to your cardiovascular health dashboard."
      }
    };

    const route = diseaseRoutes[diseases[0]];
    return route || {
      redirectTo: "/profile",
      message: "Please update your health profile."
    };
  }

  // Multiple conditions (but not diabetes+hypertension combo)
  // This handles cases like cardiovascular + hypertension, or all three conditions
  if (diseases.includes("diabetes")) {
    // If diabetes is one of multiple conditions, prioritize diabetes
    return {
      redirectTo: "/diabetes",
      message: "Welcome to your health management dashboard."
    };
  }

  // For other multiple condition combinations, show selection page
  return {
    redirectTo: "/select-disease",
    message: "Please select which condition to manage."
  };
};

// Helper: Determine redirect based on role
const determineRedirect = (user: UserDocument, diseases: string[]): RedirectResult => {
  const redirectMap: Record<string, () => RedirectResult> = {
    admin: () => ({
      redirectTo: "/admin",
      message: "Welcome Admin, you have full access."
    }),
    doctor: () => ({
      redirectTo: "/caretaker",
      message: "Welcome Doctor, here are your patients."
    }),
    patient: () => getPatientRedirect(user, diseases),
    relative: () => {
      if (!user.profileCompleted || user.invitationStatus === "pending") {
        return {
          redirectTo: "/relatives/setup",
          message: "Please complete your account setup."
        };
      }
      return {
        redirectTo: "/relatives/dashboard",
        message: "Welcome, here are your linked patients."
      };
    }
  };

  const handler = redirectMap[user.role];
  return handler ? handler() : {
    redirectTo: "/dashboard",
    message: "Welcome to SmartCare."
  };
};

// Main login route
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    await connectMongoDB();

    const user = await User.findOne({ email }).lean<UserDocument>();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // ✅ NEW: Check if patient account is pending approval
    if (user.role === "patient" && user.isApproved === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval. Please check your email for the activation link once your account has been approved.",
        code: "PENDING_APPROVAL",
        pendingApproval: true
      });
    }

    // Check for relative setup requirement
    if (user.role === "relative") {
      if (!user.password || user.password === "temporary-password-needs-reset") {
        return res.status(401).json({
          message: "Please complete your account setup first. Check your email for the setup link.",
          needsSetup: true,
          role: "relative",
          email: user.email
        });
      }

      if (user.invitationStatus === "pending") {
        return res.status(401).json({
          message: "Please complete your account setup via the link in your email.",
          needsSetup: true,
          role: "relative",
          email: user.email
        });
      }
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Process diseases for patients
    const diseases = user.role === "patient" ? extractDiseases(user) : [];

    // Update first login flag if needed (non-blocking)
    if (user.isFirstLogin) {
      User.findByIdAndUpdate(user._id, { isFirstLogin: false }).exec();
    }

    // Determine redirect
    const { redirectTo, message } = determineRedirect(user, diseases);

    // Get user name
    const userName = getUserName(user);

    // Create JWT token
    const tokenPayload: any = {
      userId: user._id,
      email: user.email,
      name: userName,
      role: user.role,
      status: user.profileCompleted ? "complete" : "incomplete"
    };

    if (user.role === "patient") {
      tokenPayload.disease = diseases;
    }

    if (user.role === "relative") {
      tokenPayload.accessLevel = user.accessLevel || "view_only";
      tokenPayload.relationship = user.relationshipToPatient;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Create safe user object
    const safeUser: any = {
      id: user._id,
      email: user.email,
      name: userName,
      role: user.role,
      profileCompleted: user.profileCompleted
    };

    if (user.role === "patient") {
      safeUser.selectedDiseases = diseases;
      // Add flag for dual condition management
      safeUser.hasDualConditions = diseases.includes("diabetes") && diseases.includes("hypertension");
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
      message
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Relative setup help endpoint
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
    }).lean<UserDocument>();

    const genericResponse = {
      success: true,
      message: "If you have a pending invitation, a new setup link has been sent to your email."
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Find associated patient
    const patient = await User.findById(user.monitoredPatient).lean<UserDocument>();
    if (!patient) {
      return res.status(200).json(genericResponse);
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
      JWT_SECRET,
      { expiresIn: SETUP_TOKEN_EXPIRY }
    );

    // Update invitation expiration
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, { invitationExpires });

    // Send email
    const emailSent = await emailService.sendRelativeInvitationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      patient.fullName || `${patient.firstName} ${patient.lastName}`,
      user.relationshipToPatient || "",
      setupToken,
      user.accessLevel || "view_only"
    );

    if (!emailSent) {
      console.error('Failed to resend setup email');
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
    console.error("Relative setup help error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;