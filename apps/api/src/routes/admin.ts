import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Patient from "../models/patient";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";
import { emailService } from "../lib/emailService";

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    console.log("✅ Admin authenticated:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Admin authentication failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get all patients for admin dashboard
router.get("/patients", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const {
      page = 1,
      limit = 10,
      search = "",
      disease = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    // Search filter - ADDED EMAIL SEARCH
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }, // ✅ ADDED: Search emergency email
        { phoneNumber: { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
        { "user.phoneNumber": { $regex: search, $options: "i" } }
      ];
    }

    // Disease filter
    if (disease) {
      if (disease === "diabetes") {
        filter.diabetes = true;
      } else if (disease === "hypertension") {
        filter.hypertension = true;
      }
    }

    // Get patients with user data - ADDED EMAIL FIELD
    const patients = await Patient.aggregate([
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
        $match: filter
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1, // Emergency contact first name
          lastname: 1, // Emergency contact last name
          email: 1, // ✅ ADDED: Emergency contact email
          phoneNumber: 1, // Emergency contact phone number
          relationship: 1, // Emergency contact relationship
          dob: 1,
          gender: 1,
          weight: 1,
          height: 1,
          diabetes: 1,
          hypertension: 1,
          picture: 1,
          profileCompleted: "$user.profileCompleted",
          createdAt: 1,
          updatedAt: 1,
          // Patient's actual contact info from User model
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName"
        }
      },
      {
        $sort: { [sortBy as string]: sortOrder === "desc" ? -1 : 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Get total count for pagination
    const totalPatients = await Patient.aggregate([
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
        $match: filter
      },
      {
        $count: "total"
      }
    ]);

    const totalPatientsCount = totalPatients.length > 0 ? totalPatients[0].total : 0;

    // Get disease statistics
    const diabetesCount = await Patient.countDocuments({ diabetes: true });
    const hypertensionCount = await Patient.countDocuments({ hypertension: true });
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    
    // ✅ ADDED: Get relatives statistics
    const totalRelatives = await User.countDocuments({ role: "relative" });
    const pendingRelatives = await User.countDocuments({ 
      role: "relative", 
      invitationStatus: "pending" 
    });

    res.status(200).json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPatientsCount / limitNum),
          totalPatients: totalPatientsCount,
          hasNext: pageNum < Math.ceil(totalPatientsCount / limitNum),
          hasPrev: pageNum > 1
        },
        statistics: {
          totalPatients: totalPatientsCount,
          totalUsers,
          diabetesCount,
          hypertensionCount,
          totalRelatives, // ✅ ADDED
          pendingRelatives // ✅ ADDED
        }
      }
    });

  } catch (error) {
    console.error("❌ Admin fetch patients error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch patients",
      code: "SERVER_ERROR"
    });
  }
});

// Get patient details by ID - ADDED EMAIL FIELD
router.get("/patients/:id", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
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
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1, // Emergency contact first name
          lastname: 1, // Emergency contact last name
          email: 1, // ✅ ADDED: Emergency contact email
          phoneNumber: 1, // Emergency contact phone number
          relationship: 1, // Emergency contact relationship
          dob: 1,
          gender: 1,
          weight: 1,
          height: 1,
          diabetes: 1,
          hypertension: 1,
          allergies: 1,
          surgeries: 1,
          picture: 1,
          profileCompleted: "$user.profileCompleted",
          createdAt: 1,
          updatedAt: 1,
          // Patient's actual contact info from User model
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName"
        }
      }
    ]);

    if (!patient || patient.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.status(200).json({
      success: true,
      data: patient[0]
    });

  } catch (error) {
    console.error("❌ Admin fetch patient details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient details"
    });
  }
});

// ✅ NEW: Get patients with pending relative requests
router.get("/patients-with-relative-requests", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patients = await Patient.aggregate([
      {
        $match: {
          email: { $exists: true, $nin: [null, ""] } // Has emergency email
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
          hasRelativeAccount: false // Only show those without relative account
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1,
          lastname: 1,
          email: 1, // Emergency contact email
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
});

// ✅ UPDATED: Create relative account from emergency contact (EMAIL TO RELATIVE ONLY)
router.post("/create-relative-account", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { patientId, emergencyContactEmail, accessLevel = "view_only", adminNotes } = req.body;

    console.log(`📋 Creating relative account for patient: ${patientId}, email: ${emergencyContactEmail}`);

    // Find patient by ID
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Verify emergency email matches
    if (patient.email !== emergencyContactEmail) {
      return res.status(400).json({
        success: false,
        message: "Emergency contact email doesn't match patient record"
      });
    }

    // Check if relative account already exists
    const existingRelative = await User.findOne({ 
      email: emergencyContactEmail, 
      role: "relative" 
    });

    if (existingRelative) {
      return res.status(400).json({
        success: false,
        message: "Relative account already exists for this email"
      });
    }

    // Check if email is already used by a non-relative user
    const existingUser = await User.findOne({ email: emergencyContactEmail });
    if (existingUser && existingUser.role !== "relative") {
      return res.status(400).json({
        success: false,
        message: "This email is already registered as a different user type"
      });
    }

    // Generate invitation token
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create relative user account
    const relativeUser = new User({
      email: patient.email, // Emergency contact email
      firstName: patient.firstname,
      lastName: patient.lastname,
      phoneNumber: patient.phoneNumber,
      role: "relative",
      isEmergencyContact: true,
      relationshipToPatient: patient.relationship,
      monitoredPatient: patient.userId, // Link to patient's User ID
      monitoredPatientProfile: patient._id, // Link to Patient profile
      invitationToken,
      invitationExpires,
      invitationStatus: "pending",
      accessLevel,
      adminNotes,
      profileCompleted: false,
      password: "temporary-password-needs-reset" // Will be reset via email
    });

    await relativeUser.save();

    console.log(`✅ Relative account created: ${relativeUser._id}`);

    // Generate JWT setup token for the relative
    const setupToken = jwt.sign(
      {
        userId: relativeUser._id,
        email: relativeUser.email,
        type: "relative-setup",
        patientId: patient._id,
        patientName: patient.fullName,
        relativeName: `${patient.firstname} ${patient.lastname}`,
        relationship: patient.relationship,
        accessLevel: accessLevel
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" } // 7 days for relatives
    );

    // ✅ Send email to relative ONLY (no patient notification)
    const relativeName = `${patient.firstname} ${patient.lastname}`;
    const patientName = patient.fullName;
    
    console.log(`📧 Sending invitation email to relative: ${relativeUser.email}`);
    
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      relativeName,
      patientName,
      patient.relationship,
      setupToken,
      accessLevel
    );

    if (!emailSent) {
      console.error('❌ Failed to send invitation email to relative');
      // Continue anyway, but log the error
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? "Relative account created successfully. Invitation email sent to relative." 
        : "Relative account created but email sending failed. Please contact the relative manually.",
      data: {
        relativeId: relativeUser._id,
        email: relativeUser.email,
        patientName: patient.fullName,
        relativeName: relativeName,
        relationship: patient.relationship,
        accessLevel,
        invitationStatus: "pending",
        invitationExpires,
        emailSent: emailSent,
        setupToken: emailSent ? undefined : setupToken // Only return token if email failed (for manual setup)
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
});

// Get dashboard statistics - ADDED RELATIVES STATS
router.get("/statistics", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const [
      totalPatients,
      totalUsers,
      diabetesCount,
      hypertensionCount,
      recentPatients,
      totalRelatives,
      pendingRelatives,
      activeRelatives,
      completedRelativeProfiles
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: { $ne: "admin" } }),
      Patient.countDocuments({ diabetes: true }),
      Patient.countDocuments({ hypertension: true }),
      Patient.aggregate([
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
          $project: {
            fullName: 1,
            diabetes: 1,
            hypertension: 1,
            email: 1, // ✅ ADDED: Emergency contact email
            patientEmail: "$user.email",
            createdAt: 1
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 5
        }
      ]),
      User.countDocuments({ role: "relative" }), // ✅ ADDED
      User.countDocuments({ role: "relative", invitationStatus: "pending" }), // ✅ ADDED
      User.countDocuments({ role: "relative", invitationStatus: "accepted" }), // ✅ ADDED
      User.countDocuments({ role: "relative", profileCompleted: true }) // ✅ ADDED
    ]);

    // Get monthly registration stats
    const monthlyStats = await Patient.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get relative statistics by month
    const relativeMonthlyStats = await User.aggregate([
      {
        $match: { role: "relative" }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalUsers,
        diabetesCount,
        hypertensionCount,
        totalRelatives,
        pendingRelatives,
        activeRelatives,
        completedRelativeProfiles,
        recentPatients,
        monthlyStats,
        relativeMonthlyStats
      }
    });

  } catch (error) {
    console.error("❌ Admin statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
});

// Delete patient
router.delete("/patients/:id", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Delete the patient record
    await Patient.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (error) {
    console.error("❌ Admin delete patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient"
    });
  }
});

// Search patients with enhanced search - ADDED EMAIL SEARCH
router.get("/search", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required"
      });
    }

    const patients = await Patient.aggregate([
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
        $match: {
          $or: [
            { fullName: { $regex: searchTerm, $options: "i" } },
            { firstname: { $regex: searchTerm, $options: "i" } },
            { lastname: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } }, // ✅ ADDED: Emergency email search
            { phoneNumber: { $regex: searchTerm, $options: "i" } },
            { "user.email": { $regex: searchTerm, $options: "i" } },
            { "user.phoneNumber": { $regex: searchTerm, $options: "i" } },
            { "user.firstName": { $regex: searchTerm, $options: "i" } },
            { "user.lastName": { $regex: searchTerm, $options: "i" } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1,
          lastname: 1,
          email: 1, // ✅ ADDED: Emergency contact email
          phoneNumber: 1,
          relationship: 1,
          diabetes: 1,
          hypertension: 1,
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName",
          createdAt: 1
        }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error("❌ Admin search patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search patients"
    });
  }
});

// ✅ NEW: Resend invitation email to relative
router.post("/resend-relative-invitation", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { relativeId } = req.body;

    // Find relative user
    const relativeUser = await User.findById(relativeId);
    if (!relativeUser || relativeUser.role !== "relative") {
      return res.status(404).json({
        success: false,
        message: "Relative account not found"
      });
    }

    // Find associated patient
    const patient = await Patient.findOne({ 
      email: relativeUser.email,
      firstname: relativeUser.firstName,
      lastname: relativeUser.lastName
    });

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
        patientName: patient.fullName,
        relativeName: `${relativeUser.firstName} ${relativeUser.lastName}`,
        relationship: patient.relationship,
        accessLevel: relativeUser.accessLevel || "view_only"
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "7d" }
    );

    // Update invitation expiration
    relativeUser.invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await relativeUser.save();

    // Send email to relative ONLY
    const emailSent = await emailService.sendRelativeInvitationEmail(
      relativeUser.email,
      `${relativeUser.firstName} ${relativeUser.lastName}`,
      patient.fullName,
      patient.relationship,
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
});

// ✅ NEW: Get all relatives list
router.get("/relatives", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { page = 1, limit = 10, status = "" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = { role: "relative" };
    if (status === "pending") {
      filter.invitationStatus = "pending";
    } else if (status === "accepted") {
      filter.invitationStatus = "accepted";
    } else if (status === "active") {
      filter.profileCompleted = true;
    }

    // Get relatives with patient info
    const relatives = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "patients",
          let: { relativeEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$email", "$$relativeEmail"] }
                  ]
                }
              }
            }
          ],
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
          profileCompleted: 1,
          accessLevel: 1,
          createdAt: 1,
          patientName: "$patient.fullName",
          patientEmail: "$patientUser.email",
          relationship: "$relationshipToPatient"
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    // Get total count
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
});

export default router;