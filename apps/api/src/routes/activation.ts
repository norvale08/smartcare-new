import express, { Request, Response } from 'express';
import { connectMongoDB } from '../lib/mongodb';
import User from '../models/user';
import ApprovalToken from '../models/Approvaltoken';

const router = express.Router();

// Type definitions for lean queries
interface ApprovalTokenLean {
  _id: any;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserLean {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  isApproved: boolean;
}

// Verify activation token (called when page loads)
router.get('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        valid: false,
        message: 'Missing token or email'
      });
    }

    await connectMongoDB();

    // Find the token
    const approvalToken = await ApprovalToken.findOne({
      email: email as string,
      token: token as string
    }).lean<ApprovalTokenLean>();

    if (!approvalToken) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid activation link'
      });
    }

    // Check if expired
    if (approvalToken.expiresAt < new Date()) {
      return res.status(400).json({
        valid: false,
        message: 'Activation link has expired'
      });
    }

    // Check if already used
    if (approvalToken.used) {
      return res.status(400).json({
        valid: false,
        message: 'This activation link has already been used',
        alreadyActivated: true
      });
    }

    // Find user
    const user = await User.findOne({ email: email as string })
      .select('firstName lastName email isApproved')
      .lean<UserLean>();

    if (!user) {
      return res.status(404).json({
        valid: false,
        message: 'User not found'
      });
    }

    // Check if already approved
    if (user.isApproved) {
      return res.status(400).json({
        valid: false,
        message: 'Account is already activated',
        alreadyActivated: true
      });
    }

    // Token is valid
    res.status(200).json({
      valid: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      valid: false,
      message: 'Server error'
    });
  }
});

// Activate account (called when user clicks "Activate My Account")
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing token or email'
      });
    }

    await connectMongoDB();

    // Find the token (NOT using .lean() since we need to save it)
    const approvalToken = await ApprovalToken.findOne({
      email,
      token
    });

    if (!approvalToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activation link'
      });
    }

    // Check if expired
    if (approvalToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Activation link has expired'
      });
    }

    // Check if already used
    if (approvalToken.used) {
      return res.status(400).json({
        success: false,
        message: 'This activation link has already been used'
      });
    }

    // Find and update user (NOT using .lean() since we need to save it)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Account is already activated'
      });
    }

    // ✅ ACTIVATE THE ACCOUNT
    user.isApproved = true;
    user.emailVerified = true;
    await user.save();

    // Mark token as used
    approvalToken.used = true;
    await approvalToken.save();

    res.status(200).json({
      success: true,
      message: 'Account activated successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during activation'
    });
  }
});

export default router;