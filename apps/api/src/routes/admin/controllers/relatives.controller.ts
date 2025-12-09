import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
  console.log('\n=== CREATE RELATIVE ACCOUNT DEBUG ===');
  console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Content-Type:', req.headers['content-type']);
  
  try {
    await connectMongoDB();

    const { patientId, emergencyContactEmail, accessLevel = "view_only", adminNotes }: CreateRelativeRequest = req.body;

    console.log(`📋 Creating relative account for patient: ${patientId}`);
    console.log(`📧 Emergency contact email: ${emergencyContactEmail}`);

    // VALIDATION: Check if all required fields exist
    if (!patientId || !emergencyContactEmail) {
      console.error('❌ Missing required fields:', {
        patientId: !!patientId,
        emergencyContactEmail: !!emergencyContactEmail
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId and emergencyContactEmail are required",
        missingFields: {
          patientId: !patientId,
          emergencyContactEmail: !emergencyContactEmail
        }
      });
    }

    // VALIDATION: Check patientId format
    if (!/^[0-9a-fA-F]{24}$/.test(patientId)) {
      console.error('❌ Invalid patientId format:', patientId);
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format. Must be 24-character MongoDB ObjectId",
        patientId
      });
    }

    // VALIDATION: Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emergencyContactEmail)) {
      console.error('❌ Invalid email format:', emergencyContactEmail);
      return res.status(400).json({
        success: false,
        message: "Invalid email format for emergency contact",
        email: emergencyContactEmail
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

    console.log('✅ Found patient:', {
      id: patient._id,
      name: patient.fullName,
      email: patient.email
    });

    // Check if relative already exists with this email
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

    console.log('🔑 Generated invitation token, expires:', invitationExpires);

    // Get relative name from patient emergency contact info
    const relativeFirstName = patient.firstname || 'Family';
    const relativeLastName = patient.lastname || 'Member';
    const relativeFullName = `${relativeFirstName} ${relativeLastName}`;

    // ✅ FIXED: Create relative user with ALL required fields
    const relativeUser = new User({
      email: emergencyContactEmail,
      firstName: relativeFirstName,
      lastName: relativeLastName,
      phoneNumber: patient.phoneNumber || '',
      role: "relative",
      
      // ✅ CRITICAL: Add ALL relative-specific fields
      isEmergencyContact: true,
      relationshipToPatient: patient.relationship || 'Family Member',
      monitoredPatient: patient.userId,
      monitoredPatientProfile: patient._id,
      
      // ✅ CRITICAL: Add invitation fields
      invitationToken,
      invitationExpires,
      invitationStatus: "pending",
      invitationSentAt: new Date(),
      
      accessLevel,
      adminNotes: adminNotes || `Relative account created by admin for ${patient.fullName}`,
      profileCompleted: false,
      password: "temporary-password-needs-reset",
      
      // ✅ Add other required User schema fields
      isFirstLogin: true,
      fullName: relativeFullName,
      firstname: relativeFirstName,
      lastname: relativeLastName,
      
      // Set default values for other fields
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

    console.log(`✅ Relative account created: ${relativeUser._id}`);
    console.log(`📧 Relative email: ${relativeUser.email}`);
    console.log('📋 Relative document:', JSON.stringify(relativeUser.toObject(), null, 2));

    // Generate setup token for the relative
    const setupToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        type: "relative-setup",
        patientId: patient._id,
        patientName: patient.fullName,
        relativeName: relativeFullName,
        relationship: patient.relationship || 'Family Member',
        accessLevel: accessLevel
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    const patientName = patient.fullName;
    
    console.log(`📧 Sending invitation email to relative: ${relativeUser.email}`);
    console.log(`   Patient: ${patientName}`);
    console.log(`   Relative: ${relativeFullName}`);
    console.log(`   Relationship: ${patient.relationship}`);
    console.log(`🔑 Setup Token: ${setupToken.substring(0, 50)}...`);
    
    // ✅ CRITICAL FIX: Just pass the token, not a URL
    // Send email to the emergency contact (relative)
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email, // Send to relative's email
      relativeFullName,   // Relative's name
      patientName,        // Patient's name
      patient.relationship || 'Family Member',
      setupToken,         // ✅ JUST THE TOKEN STRING, not a URL
      accessLevel
    );

    console.log(`📧 Email send result: ${emailSent ? '✅ Success' : '❌ Failed'}`);

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
        setupToken: emailSent ? undefined : setupToken // Only send token if email failed
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

    // ✅ CRITICAL FIX: Just pass the token, not a URL
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      `${relativeUser.firstName} ${relativeUser.lastName}`,
      patient.fullName,
      relativeUser.relationshipToPatient || patient.relationship,
      setupToken,         // ✅ JUST THE TOKEN STRING, not a URL
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