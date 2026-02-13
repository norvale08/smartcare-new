import { Request, Response } from "express";
import crypto from "crypto";
import { connectMongoDB } from "../../../lib/mongodb";
import User from "../../../models/user";
import ApprovalToken from "../../../models/Approvaltoken";
import { emailService } from "../../../lib/emailService"

// ✅ Helper function to generate unique patient ID
async function generatePatientId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PT${year}`;
  
  // Find the highest existing patient ID for this year
  const lastPatient = await User.findOne({
    patientId: { $regex: `^${prefix}` }
  }).sort({ patientId: -1 });
  
  let sequence = 1;
  if (lastPatient && lastPatient.patientId) {
    const lastSequence = parseInt(lastPatient.patientId.substring(prefix.length + 1)); // +1 for the dash
    sequence = lastSequence + 1;
  }
  
  // Format: PT2026-0001, PT2026-0002, etc.
  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

// Get all pending approval patients
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const pendingPatients = await User.find({
      role: "patient",
      isApproved: false,
      isRejected: { $ne: true }, // Exclude already rejected patients
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

// ✅ UPDATED: Approve patient account with unique Patient ID
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

    if (patient.isRejected) {
      return res.status(400).json({
        success: false,
        message: "This patient registration was previously rejected"
      });
    }

    // ✅ Generate unique patient ID
    const uniquePatientId = await generatePatientId();
    console.log('\n🆔 Generated Patient ID:', uniquePatientId);

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

    // ✅ Update patient status with Patient ID
    patient.isApproved = true;
    patient.approvedAt = new Date();
    patient.approvedBy = adminId;
    patient.patientId = uniquePatientId; // Assign unique patient ID
    await patient.save();

    console.log('\n✅ Patient Approved:');
    console.log('   Name:', `${patient.firstName} ${patient.lastName}`);
    console.log('   Email:', patient.email);
    console.log('   Patient ID:', uniquePatientId);

    // ✅ Send approval email with activation link AND patient ID
    const emailSent = await emailService.sendAccountApprovedEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      approvalToken,
      uniquePatientId // Pass patient ID to email
    );

    if (!emailSent) {
      console.error('⚠️  Failed to send approval email to:', patient.email);
      // Still return success but warn about email
      return res.status(200).json({
        success: true,
        message: "Patient approved but email failed to send",
        emailSent: false,
        data: {
          patientId: patient._id,
          uniquePatientId: uniquePatientId,
          email: patient.email,
          approvedAt: patient.approvedAt
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient approved successfully. Activation email sent with Patient ID.",
      emailSent: true,
      data: {
        patientId: patient._id,
        uniquePatientId: uniquePatientId,
        email: patient.email,
        name: `${patient.firstName} ${patient.lastName}`,
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

// ✅ NEW: Reject patient account with custom reason email
export const rejectPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { reason } = req.body; // Admin must provide rejection reason
    const adminId = (req as any).user?.userId; // From auth middleware

    await connectMongoDB();

    // Validate rejection reason
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

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
        message: "Cannot reject an already approved patient"
      });
    }

    if (patient.isRejected) {
      return res.status(400).json({
        success: false,
        message: "This patient registration was already rejected"
      });
    }

    // Get admin name for email
    const admin = await User.findById(adminId);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : undefined;

    // ✅ Mark as rejected (don't delete - keep for records)
    patient.isRejected = true;
    patient.rejectedAt = new Date();
    patient.rejectedBy = adminId;
    patient.rejectionReason = reason.trim();
    await patient.save();

    console.log('\n❌ Patient Rejected:');
    console.log('   Name:', `${patient.firstName} ${patient.lastName}`);
    console.log('   Email:', patient.email);
    console.log('   Reason:', reason);
    console.log('   Rejected by:', adminName || 'Admin');

    // ✅ Send rejection email with custom reason
    const emailSent = await emailService.sendAccountRejectedEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      reason.trim(),
      adminName
    );

    if (!emailSent) {
      console.error('⚠️  Failed to send rejection email to:', patient.email);
    }

    res.status(200).json({
      success: true,
      message: "Patient registration rejected. Rejection email sent.",
      emailSent: emailSent,
      data: {
        patientId: patient._id,
        email: patient.email,
        name: `${patient.firstName} ${patient.lastName}`,
        rejectionReason: reason.trim(),
        rejectedAt: patient.rejectedAt
      }
    });

  } catch (error) {
    console.error("❌ Reject patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject patient"
    });
  }
};

// ✅ UPDATED: Get approval statistics (including rejected)
export const getApprovalStatistics = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const totalPatients = await User.countDocuments({ role: "patient" });
    const approvedPatients = await User.countDocuments({ 
      role: "patient", 
      isApproved: true 
    });
    const rejectedPatients = await User.countDocuments({ 
      role: "patient", 
      isRejected: true 
    });
    const pendingApprovals = await User.countDocuments({ 
      role: "patient", 
      isApproved: false,
      isRejected: { $ne: true },
      emailVerified: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        approvedPatients,
        rejectedPatients,
        pendingApprovals,
        approvalRate: totalPatients > 0 
          ? ((approvedPatients / totalPatients) * 100).toFixed(1) 
          : 0,
        rejectionRate: totalPatients > 0 
          ? ((rejectedPatients / totalPatients) * 100).toFixed(1) 
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

// ✅ NEW: Get all rejected patients (for admin review)
export const getRejectedPatients = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const rejectedPatients = await User.find({
      role: "patient",
      isRejected: true
    })
    .select('firstName lastName email phoneNumber rejectionReason rejectedAt rejectedBy createdAt')
    .populate('rejectedBy', 'firstName lastName')
    .sort({ rejectedAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      data: {
        rejectedPatients,
        count: rejectedPatients.length
      }
    });

  } catch (error) {
    console.error("❌ Get rejected patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rejected patients"
    });
  }
};