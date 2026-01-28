import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { connectMongoDB } from '../lib/mongodb';
import { emailService } from '../lib/emailService';

const router = express.Router();

//  Verify invitation token and get relative info
router.get('/verify-invitation/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    await connectMongoDB();

    // Verify JWT token
    const decoded: any = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-default-secret"
    );

    // Check token type
    if (decoded.type !== "relative-setup") {
      return res.status(400).json({
        success: false,
        message: "Invalid token type"
      });
    }

    // Find relative user
    const relativeUser = await User.findById(decoded.userId);
    if (!relativeUser || relativeUser.role !== "relative") {
      return res.status(404).json({
        success: false,
        message: "Relative account not found"
      });
    }

    // Check if invitation is still pending
    if (relativeUser.invitationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invitation has already been processed"
      });
    }

    // Check if token is expired
    if (relativeUser.invitationExpires && relativeUser.invitationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invitation link has expired. Please contact the administrator."
      });
    }

    // Return relative info (safe data only)
    res.status(200).json({
      success: true,
      data: {
        relativeId: relativeUser._id,
        email: relativeUser.email,
        firstName: relativeUser.firstName,
        lastName: relativeUser.lastName,
        patientName: decoded.patientName,
        relationship: decoded.relationship,
        accessLevel: decoded.accessLevel,
        invitationExpires: relativeUser.invitationExpires
      }
    });

  } catch (error: any) {
    console.error(" Verify invitation error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: "Invitation link has expired"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation link"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ✅ Complete relative setup (set password)
router.post('/complete-setup', async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    await connectMongoDB();

    // Verify token
    const decoded: any = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-default-secret"
    );

    if (decoded.type !== "relative-setup") {
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Find relative user
    const relativeUser = await User.findById(decoded.userId);
    if (!relativeUser || relativeUser.role !== "relative") {
      return res.status(404).json({
        success: false,
        message: "Relative account not found"
      });
    }

    // Check if already completed
    if (relativeUser.profileCompleted) {
      return res.status(400).json({
        success: false,
        message: "Account setup already completed"
      });
    }

    // Check invitation status
    if (relativeUser.invitationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invitation is no longer valid"
      });
    }

    // Check expiration
    if (relativeUser.invitationExpires && relativeUser.invitationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invitation has expired"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    relativeUser.password = hashedPassword;
    relativeUser.profileCompleted = true;
    relativeUser.invitationStatus = "accepted";
    relativeUser.isFirstLogin = false;
    
    await relativeUser.save();


    // Generate login token for immediate login
    const loginToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        name: `${relativeUser.firstName} ${relativeUser.lastName}`,
        role: relativeUser.role,
        status: "complete"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Account setup completed successfully",
      data: {
        user: {
          id: relativeUser._id,
          email: relativeUser.email,
          firstName: relativeUser.firstName,
          lastName: relativeUser.lastName,
          role: relativeUser.role,
          profileCompleted: relativeUser.profileCompleted,
          accessLevel: relativeUser.accessLevel
        },
        token: loginToken,
        redirectTo: "/relative/dashboard"
      }
    });

  } catch (error: any) {
    console.error("Complete setup error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: "Setup link has expired"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: "Invalid setup link"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Resend setup email
router.post('/resend-setup-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    await connectMongoDB();

    // Find relative
    const relativeUser = await User.findOne({ 
      email, 
      role: "relative",
      invitationStatus: "pending"
    });

    if (!relativeUser) {
      return res.status(404).json({
        success: false,
        message: "No pending invitation found for this email"
      });
    }

    // Find associated patient
    const patient = await User.findById(relativeUser.monitoredPatient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Associated patient not found"
      });
    }

    // Generate new setup token
    const setupToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        type: "relative-setup",
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        relativeName: `${relativeUser.firstName} ${relativeUser.lastName}`,
        relationship: relativeUser.relationshipToPatient,
        accessLevel: relativeUser.accessLevel || "view_only"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    // Update expiration
    relativeUser.invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await relativeUser.save();

    // Send email
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      `${relativeUser.firstName} ${relativeUser.lastName}`,
      `${patient.firstName} ${patient.lastName}`,
      relativeUser.relationshipToPatient,
      setupToken,
      relativeUser.accessLevel || "view_only"
    );

    if (!emailSent) {
      console.error(' Failed to resend setup email');
    }

    res.status(200).json({
      success: true,
      message: emailSent 
        ? "Setup email resent successfully" 
        : "Email sending failed. Please contact the administrator.",
      emailSent
    });

  } catch (error) {
    console.error(" Resend setup email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;