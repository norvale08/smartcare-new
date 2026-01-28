import { Request, Response } from "express";
import crypto from "crypto";
import { connectMongoDB } from "../../../lib/mongodb";
import User from "../../../models/user";
import ApprovalToken from "../../../models/Approvaltoken";
import { emailService } from "../../../lib/emailService";

// Get all pending approval patients
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const pendingPatients = await User.find({
      role: "patient",
      isApproved: false,
      emailVerified: true
    })
    .select('firstName lastName email phoneNumber createdAt')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      data: {
        pendingPatients,
        count: pendingPatients.length
      }
    });

  } catch (error) {
    console.error("❌ Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals"
    });
  }
};

// Approve patient account
export const approvePatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const adminId = (req as any).user?.userId; // From auth middleware

    await connectMongoDB();

    // Find the patient
    const patient = await User.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "User is not a patient"
      });
    }

    if (patient.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Patient is already approved"
      });
    }

    // Generate unique approval token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Create approval token in database
    const tokenDoc = new ApprovalToken({
      email: patient.email,
      token: approvalToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false
    });

    await tokenDoc.save();

    // Update patient status (but keep isApproved false until they click the link)
    patient.approvedAt = new Date();
    patient.approvedBy = adminId;
    await patient.save();

    // Send approval email with activation link
    const emailSent = await emailService.sendAccountApprovedEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      approvalToken
    );

    if (!emailSent) {
      console.error('Failed to send approval email to:', patient.email);
      // Still return success but warn about email
      return res.status(200).json({
        success: true,
        message: "Patient approved but email failed to send",
        emailSent: false,
        data: {
          patientId: patient._id,
          email: patient.email,
          approvedAt: patient.approvedAt
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient approved successfully. Activation email sent.",
      emailSent: true,
      data: {
        patientId: patient._id,
        email: patient.email,
        approvedAt: patient.approvedAt
      }
    });

  } catch (error) {
    console.error("❌ Approve patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve patient"
    });
  }
};

// Reject patient account
export const rejectPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { reason } = req.body;

    await connectMongoDB();

    const patient = await User.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "User is not a patient"
      });
    }

    // Delete the patient account
    await User.findByIdAndDelete(patientId);

    // TODO: Optionally send rejection email
    // await emailService.sendAccountRejectedEmail(patient.email, patient.firstName, reason);

    res.status(200).json({
      success: true,
      message: "Patient account rejected and deleted"
    });

  } catch (error) {
    console.error("❌ Reject patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject patient"
    });
  }
};

// Get approval statistics
export const getApprovalStatistics = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const totalPatients = await User.countDocuments({ role: "patient" });
    const approvedPatients = await User.countDocuments({ 
      role: "patient", 
      isApproved: true 
    });
    const pendingApprovals = await User.countDocuments({ 
      role: "patient", 
      isApproved: false,
      emailVerified: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        approvedPatients,
        pendingApprovals,
        approvalRate: totalPatients > 0 
          ? ((approvedPatients / totalPatients) * 100).toFixed(1) 
          : 0
      }
    });

  } catch (error) {
    console.error("❌ Get approval statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approval statistics"
    });
  }
};