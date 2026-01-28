import express, { Request, Response } from 'express';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import PasswordResetToken from '../models/resetToken';
import { connectMongoDB } from '../lib/mongodb';
import { emailService } from '../lib/emailService';

const router = express.Router();

// Type definitions
interface UserDocument {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: string;
  isApproved: boolean;
  emailVerified: boolean;
  isFirstLogin?: boolean;
  profileCompleted?: boolean;
  diabetes?: boolean;
  hypertension?: boolean;
  cardiovascular?: boolean;
}

interface ResetTokenDocument {
  _id: any;
  email: string;
  token: string;
  expiresAt: Date;
}

// ============================================
// REGISTRATION ROUTE
// ============================================
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, dataConsent } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ['firstName', 'lastName', 'email', 'password']
      });
    }

    // Validate data consent
    if (!dataConsent) {
      return res.status(400).json({ 
        message: "Data consent is required to register" 
      });
    }

    await connectMongoDB();

    // Check if user exists with lean() for better performance
    const existingUser = await User.findOne({ email }).lean<UserDocument>();
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with approval pending
    const userData = {
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      password: hashedPassword,
      isApproved: false, // ✅ Requires admin approval
      emailVerified: true, // Email is validated during registration
      role: 'patient'
    };
    
    await User.create(userData);

    // Send registration pending email
    emailService.sendRegistrationPendingEmail(
      email,
      `${firstName} ${lastName}`
    ).catch(err => console.error('Email send error:', err));

    // ✅ CHANGED: Don't redirect to login, return success status
    res.status(201).json({ 
      message: "Registration successful! Your account is pending admin approval. You will receive an email once approved.",
      success: true,
      pendingApproval: true,
      // Remove redirectTo - handle in frontend instead
      email: email // Send back email for confirmation display
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// LOGIN ROUTE
// ============================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    await connectMongoDB();

    // Find user
    const user = await User.findOne({ email }).lean<UserDocument>();

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // ✅ CHECK APPROVAL STATUS (for patients only)
    if (user.role === 'patient' && !user.isApproved) {
      return res.status(403).json({
        message: 'Your account is pending admin approval. Please check your email for the activation link once your account has been approved.',
        code: 'PENDING_APPROVAL',
        pendingApproval: true
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isFirstLogin: user.isFirstLogin,
        profileCompleted: user.profileCompleted,
        isApproved: user.isApproved,
        // Add disease flags for redirect logic
        diabetes: user.diabetes,
        hypertension: user.hypertension,
        cardiovascular: user.cardiovascular
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
});

// ============================================
// RESET PASSWORD ROUTE
// ============================================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body;

    // Validate input
    if (!token || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['token', 'email', 'password']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long'
      });
    }

    await connectMongoDB();

    // Find the reset token with lean() - faster query
    const resetTokenDoc = await PasswordResetToken.findOne({
      email,
      token
    }).lean<ResetTokenDocument>();

    if (!resetTokenDoc) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token has expired
    if (resetTokenDoc.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });
      return res.status(400).json({ 
        message: 'Reset token has expired. Please request a new one.'
      });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password using findByIdAndUpdate (more efficient)
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Delete the used reset token
    await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

    res.status(200).json({ 
      message: 'Password reset successfully',
      success: true,
      redirectTo: "/login"
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Server error'
    });
  }
});

// ============================================
// REQUEST PASSWORD RESET ROUTE
// ============================================
router.post('/request-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await connectMongoDB();

    // Use lean() for faster query
    const user = await User.findOne({ email }).lean<UserDocument>();
    
    // Generic response for security (don't reveal if user exists)
    const genericResponse = { 
      message: 'If an account exists with this email, a reset link has been sent.',
      success: true
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const passwordResetToken = new PasswordResetToken({
      email: user.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await passwordResetToken.save();

    // Send email (non-blocking if possible)
    emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.firstName} ${user.lastName}`
    ).catch(err => console.error('Email send error:', err));

    res.status(200).json(genericResponse);

  } catch (error: any) {
    console.error('Request reset error:', error);
    res.status(500).json({ 
      message: 'Server error'
    });
  }
});

export default router;