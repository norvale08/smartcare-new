import express, { Request, Response } from 'express';
import bcrypt from "bcryptjs";
import User from '../models/user';
import PasswordResetToken from '../models/resetToken';
import { connectMongoDB } from '../lib/mongodb';

const router = express.Router();

// Existing registration route
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    await connectMongoDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      firstName, lastName, email, phoneNumber, password: hashedPassword
    }
    const user = await User.create(userData)
    res.status(201).json({ message: "user registered successfully" })

  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
});

// ✅ NEW: Reset Password Route
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body;

    console.log('=== RESET PASSWORD REQUEST ===');
    console.log('Email:', email);
    console.log('Token:', token?.substring(0, 10) + '...');

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

    // Find the reset token
    const resetTokenDoc = await PasswordResetToken.findOne({
      email: email,
      token: token
    });

    if (!resetTokenDoc) {
      console.log('❌ Reset token not found for email:', email);
      return res.status(400).json({ 
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token has expired
    if (resetTokenDoc.expiresAt < new Date()) {
      console.log('❌ Reset token expired at:', resetTokenDoc.expiresAt);
      await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });
      return res.status(400).json({ 
        message: 'Reset token has expired. Please request a new one.'
      });
    }

    // Find the user
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        message: 'User not found'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Delete the used reset token
    await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

    console.log('✅ Password reset successful for:', email);
    res.status(200).json({ 
      message: 'Password reset successfully',
      success: true
    });

  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// ✅ OPTIONAL: Request Password Reset (if you want users to request resets themselves)
router.post('/request-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await connectMongoDB();

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    // Generate reset token (you'll need to import crypto and emailService)
    const crypto = require('crypto');
    const { emailService } = require('../lib/emailService');
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const passwordResetToken = new PasswordResetToken({
      email: user.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await passwordResetToken.save();

    // Send email
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.firstName} ${user.lastName}`
    );

    res.status(200).json({ 
      message: 'If an account exists with this email, a reset link has been sent.'
    });

  } catch (error: any) {
    console.error('Request reset error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;