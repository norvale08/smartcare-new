// apps/api/src/routes/admin/controllers/relatives.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectMongoDB } from "../../../lib/mongodb";
import { emailService } from "../../../lib/emailService";
import Patient from "../../../models/patient";
import User from "../../../models/user";

interface CreateRelativeRequest {
  patientId: string;
  emergencyContactEmail: string;
  accessLevel?: string;
  adminNotes?: string;
}

// Helper to convert to ObjectId
const toObjectId = (id: any) => {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (e) {
    console.error("ObjectId conversion failed:", e);
  }
  return id;
};

export const getPatientsWithRelativeRequests = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const patients = await Patient.aggregate([
      {
        $match: {
          email: { $exists: true, $nin: [null, ""] }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "users",
          let: { emergencyEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$email", "$$emergencyEmail"] },
                    { $eq: ["$role", "relative"] }
                  ]
                }
              }
            }
          ],
          as: "relativeAccount"
        }
      },
      {
        $addFields: {
          hasRelativeAccount: { $gt: [{ $size: "$relativeAccount" }, 0] }
        }
      },
      {
        $match: {
          hasRelativeAccount: false
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1,
          lastname: 1,
          email: 1,
          phoneNumber: 1,
          relationship: 1,
          patientEmail: "$user.email",
          patientName: "$user.fullName",
          createdAt: 1,
          hasRelativeAccount: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        patients,
        count: patients.length
      }
    });

  } catch (error) {
    console.error("❌ Get patients with relative requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients with relative requests"
    });
  }
};

export const createRelativeAccount = async (req: Request, res: Response) => {
 
  try {
    await connectMongoDB();

    const { patientId, emergencyContactEmail, accessLevel = "view_only", adminNotes }: CreateRelativeRequest = req.body;

    console.log(`📋 Creating relative account for patient: ${patientId}`);
    console.log(`📧 Emergency contact email: ${emergencyContactEmail}`);

    // VALIDATION
    if (!patientId || !emergencyContactEmail) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId and emergencyContactEmail are required"
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(patientId)) {
      console.error('❌ Invalid patientId format:', patientId);
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emergencyContactEmail)) {
      console.error('❌ Invalid email format:', emergencyContactEmail);
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      console.error('❌ Patient not found with ID:', patientId);
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    
    // ✅ CRITICAL: Get the patient's User account
    const patientUser = await User.findById(toObjectId(patient.userId));
    if (!patientUser) {
      console.error('❌ Patient User account not found:', patient.userId);
      return res.status(404).json({
        success: false,
        message: "Patient user account not found"
      });
    }

    

    // Check if relative already exists
    const existingRelative = await User.findOne({ 
      email: emergencyContactEmail, 
      role: "relative" 
    });

    if (existingRelative) {
      console.error('❌ Relative already exists with email:', emergencyContactEmail);
      return res.status(400).json({
        success: false,
        message: "Relative account already exists for this email"
      });
    }

    // Check if email is used for other role
    const existingUser = await User.findOne({ email: emergencyContactEmail });
    if (existingUser && existingUser.role !== "relative") {
      console.error('❌ Email used for different role:', existingUser.role);
      return res.status(400).json({
        success: false,
        message: "This email is already registered as a different user type"
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

   

    // Get relative name from patient emergency contact info
    const relativeFirstName = patient.firstname || 'Family';
    const relativeLastName = patient.lastname || 'Member';
    const relativeFullName = `${relativeFirstName} ${relativeLastName}`;

    // ✅ CRITICAL FIX: Create relative user with proper patient references
    const relativeUser = new User({
      email: emergencyContactEmail,
      firstName: relativeFirstName,
      lastName: relativeLastName,
      phoneNumber: patient.phoneNumber || '',
      role: "relative",
      
      // ✅ CRITICAL: Link to BOTH the User ID and Patient Profile ID
      isEmergencyContact: true,
      relationshipToPatient: patient.relationship || 'Family Member',
      monitoredPatient: toObjectId(patient.userId), // ✅ Link to User._id
      monitoredPatientProfile: patient._id,          // ✅ Link to Patient._id
      
      // Invitation fields
      invitationToken,
      invitationExpires,
      invitationStatus: "pending",
      invitationSentAt: new Date(),
      
      accessLevel,
      adminNotes: adminNotes || `Relative account created by admin for ${patient.fullName}`,
      profileCompleted: false,
      password: "temporary-password-needs-reset",
      
      // Other required User schema fields
      isFirstLogin: true,
      fullName: relativeFullName,
      firstname: relativeFirstName,
      lastname: relativeLastName,
      
      // Default values for other fields
      diabetes: false,
      hypertension: false,
      cardiovascular: false,
      selectedDiseases: [],
      dob: null,
      gender: "",
      weight: null,
      height: null,
      relationship: "",
      allergies: "",
      surgeries: "",
      conditions: "",
      picture: null,
      patientProfileId: null,
      specialization: null,
      licenseNumber: null,
      hospital: null,
      bio: "",
      yearsOfExperience: null,
      contactInfo: {
        alternateEmail: "",
        emergencyContact: ""
      },
      profileUpdatedAt: null,
      requestedDoctors: [],
      pendingRequests: [],
      assignedPatients: [],
      assignedDoctor: null,
      condition: "",
      lastVisit: null
    });

    await relativeUser.save();

  
    // Generate setup token for the relative
    const setupToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        type: "relative-setup",
        patientId: patient._id,
        patientUserId: patient.userId, // ✅ Include patient's User ID
        patientName: patient.fullName,
        relativeName: relativeFullName,
        relationship: patient.relationship || 'Family Member',
        accessLevel: accessLevel
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    const patientName = patient.fullName;
    
   
    
    // Send email to the emergency contact (relative)
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      relativeFullName,
      patientName,
      patient.relationship || 'Family Member',
      setupToken,
      accessLevel
    );

    

    res.status(201).json({
      success: true,
      message: emailSent 
        ? "Relative account created successfully. Invitation email sent to relative." 
        : "Relative account created but email sending failed. Please contact the relative manually.",
      data: {
        relativeId: relativeUser._id,
        email: relativeUser.email,
        patientName: patient.fullName,
        relativeName: relativeFullName,
        relationship: patient.relationship,
        accessLevel,
        invitationStatus: "pending",
        invitationExpires,
        emailSent: emailSent,
        setupToken: emailSent ? undefined : setupToken
      }
    });

  } catch (error) {
    console.error("❌ Create relative account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create relative account",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const resendRelativeInvitation = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const { relativeId } = req.body;

    if (!relativeId) {
      return res.status(400).json({
        success: false,
        message: "Relative ID is required"
      });
    }

    const relativeUser = await User.findById(relativeId);
    if (!relativeUser || relativeUser.role !== "relative") {
      return res.status(404).json({
        success: false,
        message: "Relative account not found"
      });
    }

    // Find associated patient through monitoredPatientProfile
    const patient = await Patient.findById(relativeUser.monitoredPatientProfile);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Associated patient not found"
      });
    }

    const setupToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        type: "relative-setup",
        patientId: patient._id,
        patientUserId: patient.userId,
        patientName: patient.fullName,
        relativeName: `${relativeUser.firstName} ${relativeUser.lastName}`,
        relationship: relativeUser.relationshipToPatient || patient.relationship,
        accessLevel: relativeUser.accessLevel || "view_only"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    // Update expiration
    relativeUser.invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    relativeUser.invitationSentAt = new Date();
    await relativeUser.save();

    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      `${relativeUser.firstName} ${relativeUser.lastName}`,
      patient.fullName,
      relativeUser.relationshipToPatient || patient.relationship,
      setupToken,
      relativeUser.accessLevel || "view_only"
    );

    if (!emailSent) {
      console.error('❌ Failed to resend invitation email');
    }

    res.status(200).json({
      success: true,
      message: emailSent 
        ? "Invitation email resent successfully to relative." 
        : "Failed to resend email. Please contact the relative manually.",
      data: {
        emailSent,
        relativeId: relativeUser._id,
        email: relativeUser.email,
        newExpiration: relativeUser.invitationExpires
      }
    });

  } catch (error) {
    console.error("❌ Resend invitation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend invitation"
    });
  }
};

export const getAllRelatives = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const { page = "1", limit = "10", status = "" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { role: "relative" };
    if (status === "pending") {
      filter.invitationStatus = "pending";
    } else if (status === "accepted") {
      filter.invitationStatus = "accepted";
    } else if (status === "active") {
      filter.profileCompleted = true;
    }

    const relatives = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "patients",
          localField: "monitoredPatientProfile",
          foreignField: "_id",
          as: "patient"
        }
      },
      {
        $unwind: {
          path: "$patient",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "monitoredPatient",
          foreignField: "_id",
          as: "patientUser"
        }
      },
      {
        $unwind: {
          path: "$patientUser",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          invitationStatus: 1,
          invitationExpires: 1,
          invitationSentAt: 1,
          profileCompleted: 1,
          accessLevel: 1,
          createdAt: 1,
          patientName: "$patient.fullName",
          patientEmail: "$patientUser.email",
          relationship: "$relationshipToPatient",
          isEmergencyContact: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const totalRelatives = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        relatives,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalRelatives / limitNum),
          totalRelatives,
          hasNext: pageNum < Math.ceil(totalRelatives / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error("❌ Get relatives error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch relatives"
    });
  }
};