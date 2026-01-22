// FILE: ./routes/adminPatients.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Patient from "../models/patient";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    );
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/admin/patients - Get all patients with pagination
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || "").trim();
    const disease = req.query.disease as string || "all";

    console.log("=== ADMIN FETCHING PATIENTS ===");
    console.log("Search term:", search);
    console.log("Disease filter:", disease);
    console.log("Page:", page, "Limit:", limit);

    // Build query filter for User model
    const userQuery: any = { role: "patient" };

    // Add search filter - FIXED: Remove phoneNumber from search as it may not exist
    if (search) {
      userQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Add disease filter
    if (disease === "diabetes") {
      userQuery.diabetes = true;
    } else if (disease === "hypertension") {
      userQuery.hypertension = true;
    }

    console.log("User query:", JSON.stringify(userQuery));

    // Count total documents matching the query
    const totalPatients = await User.countDocuments(userQuery);
    const totalPages = Math.ceil(totalPatients / limit);
    const skip = (page - 1) * limit;

    console.log(`Found ${totalPatients} patients matching query`);

    // Get paginated patients with their assigned doctor
    const patients = await User.find(userQuery)
      .populate({
        path: "assignedDoctor",
        select: "firstName lastName fullName email specialization",
        match: { role: "doctor" }
      })
      .select("firstName lastName fullName email phoneNumber assignedDoctor condition diabetes hypertension createdAt updatedAt")
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    console.log(`Retrieved ${patients.length} patients from User model`);

    // Get all patient IDs for batch lookup
    const patientUserIds = patients.map((p: any) => p._id);

    // Batch fetch all Patient records
    const patientRecords = await Patient.find({ userId: { $in: patientUserIds } })
      .select("userId firstname lastname email phoneNumber relationship dob gender weight height diabetes hypertension picture profileCompleted")
      .lean();

    console.log(`Retrieved ${patientRecords.length} patient records from Patient model`);

    // Create a map for quick lookup
    const patientRecordMap = new Map();
    patientRecords.forEach((record: any) => {
      patientRecordMap.set(record.userId.toString(), record);
    });

    // Format patients with data from both models
    const formattedPatients = patients.map((user: any) => {
      const patientRecord = patientRecordMap.get(user._id.toString());
      
      let assignedDoctorInfo = null;
      if (user.assignedDoctor && user.assignedDoctor._id) {
        assignedDoctorInfo = {
          id: user.assignedDoctor._id.toString(),
          fullName: user.assignedDoctor.fullName || 
                   `${user.assignedDoctor.firstName || ''} ${user.assignedDoctor.lastName || ''}`.trim(),
          specialization: user.assignedDoctor.specialization || "General Medicine"
        };
      }

      // FIXED: Ensure phoneNumber is always a string
      const patientPhone = user.phoneNumber ? String(user.phoneNumber) : "";
      const emergencyPhone = patientRecord?.phoneNumber ? String(patientRecord.phoneNumber) : "";

      return {
        _id: user._id.toString(),
        id: user._id.toString(),
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        
        // Patient's own contact info from User model
        patientEmail: user.email || "",
        patientPhone: patientPhone,
        patientFirstName: user.firstName || "",
        patientLastName: user.lastName || "",
        
        // Emergency contact info from Patient model
        firstname: patientRecord?.firstname || "",
        lastname: patientRecord?.lastname || "",
        email: patientRecord?.email || "",
        phoneNumber: emergencyPhone,
        relationship: patientRecord?.relationship || "",
        
        // Profile information
        dob: patientRecord?.dob || "",
        gender: patientRecord?.gender || "",
        weight: patientRecord?.weight || 0,
        height: patientRecord?.height || 0,
        picture: patientRecord?.picture || "",
        profileCompleted: patientRecord?.profileCompleted || false,
        
        // Medical conditions
        diabetes: patientRecord?.diabetes || user.diabetes || false,
        hypertension: patientRecord?.hypertension || user.hypertension || false,
        
        assignedDoctor: assignedDoctorInfo,
        assignmentSource: "unassigned",
        condition: user.condition || "hypertension",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    console.log(`✅ Formatted ${formattedPatients.length} patients`);

    // Calculate statistics
    const diabetesCount = await User.countDocuments({ role: "patient", diabetes: true });
    const hypertensionCount = await User.countDocuments({ role: "patient", hypertension: true });

    // Return structured response
    res.json({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPatients: totalPatients,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        statistics: {
          totalPatients: totalPatients,
          diabetesCount: diabetesCount,
          hypertensionCount: hypertensionCount
        }
      }
    });

  } catch (error: any) {
    console.error("❌ Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/admin/patients/simple - Simple format for doctor assignment
router.get("/simple", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    console.log("=== ADMIN FETCHING PATIENTS (SIMPLE FORMAT) ===");

    // Get all patients with their assigned doctor
    const patients = await User.find({ role: "patient" })
      .populate({
        path: "assignedDoctor",
        select: "firstName lastName fullName email specialization",
        match: { role: "doctor" }
      })
      .select("firstName lastName fullName email phoneNumber assignedDoctor condition diabetes hypertension")
      .sort({ fullName: 1 })
      .lean();

    console.log(`Retrieved ${patients.length} patients`);

    // Format patients
    const formattedPatients = patients.map((user: any) => {
      let assignedDoctorInfo = null;
      if (user.assignedDoctor && user.assignedDoctor._id) {
        assignedDoctorInfo = {
          id: user.assignedDoctor._id.toString(),
          fullName: user.assignedDoctor.fullName || 
                   `${user.assignedDoctor.firstName || ''} ${user.assignedDoctor.lastName || ''}`.trim(),
          specialization: user.assignedDoctor.specialization || "General Medicine"
        };
      }

      // FIXED: Ensure phoneNumber is always a string
      const phoneNumber = user.phoneNumber ? String(user.phoneNumber) : "";

      return {
        id: user._id.toString(),
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || "",
        phoneNumber: phoneNumber,
        assignedDoctor: assignedDoctorInfo,
        assignmentSource: assignedDoctorInfo ? "manual" : "unassigned",
        condition: user.condition || "General"
      };
    });

    res.json({
      success: true,
      patients: formattedPatients
    });

  } catch (error: any) {
    console.error("❌ Error fetching patients (simple):", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
});

router.get("/from-patient-model", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log("=== ADMIN FETCHING PATIENTS FROM PATIENT MODEL ===");
    
    await connectMongoDB();

    const patients = await Patient.find()
      .populate({
        path: "userId",
        select: "firstName lastName fullName email phoneNumber role condition"
      })
      .populate({
        path: "doctorId",
        select: "firstName lastName fullName email specialization",
        match: { role: "doctor" }
      })
      .sort({ fullName: 1 });

    console.log(`Found ${patients.length} patients in Patient model`);

    const formattedPatients = patients.map((patient: any) => {
      if (!patient.userId) {
        console.log(`Warning: Patient record ${patient._id} has no associated user`);
        return null;
      }

      let assignedDoctorInfo = null;
      if (patient.doctorId && patient.doctorId._id) {
        assignedDoctorInfo = {
          id: patient.doctorId._id.toString(),
          fullName: patient.doctorId.fullName || 
                   `${patient.doctorId.firstName} ${patient.doctorId.lastName}`,
          specialization: patient.doctorId.specialization || "General Medicine"
        };
      }

      const phoneNumber = patient.phoneNumber || patient.userId.phoneNumber;
      const phoneNumberStr = phoneNumber ? String(phoneNumber) : "";

      return {
        id: patient.userId._id.toString(),
        fullName: patient.fullName || patient.userId.fullName || 
                 `${patient.userId.firstName} ${patient.userId.lastName}`,
        email: patient.email || patient.userId.email,
        phoneNumber: phoneNumberStr,
        assignedDoctor: assignedDoctorInfo,
        assignmentSource: patient.assignmentSource || "unassigned",
        condition: patient.userId.condition || "hypertension"
      };
    }).filter(Boolean);

    console.log(`✅ Formatted ${formattedPatients.length} patients`);

    res.json({
      success: true,
      patients: formattedPatients,
      count: formattedPatients.length
    });

  } catch (error: any) {
    console.error("❌ Error fetching patients from Patient model:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
});

router.get("/debug", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await connectMongoDB();
    
    const patientCount = await User.countDocuments({ role: "patient" });
    const doctorCount = await User.countDocuments({ role: "doctor" });
    const adminCount = await User.countDocuments({ role: "admin" });
    
    const sampleUserPatients = await User.find({ role: "patient" })
      .select("_id firstName lastName email phoneNumber assignedDoctor condition")
      .limit(5);
    
    const samplePatientRecords = await Patient.find()
      .populate({
        path: "userId",
        select: "firstName lastName email role"
      })
      .limit(5);

    res.json({
      success: true,
      counts: {
        patients_in_user_model: patientCount,
        doctors: doctorCount,
        admins: adminCount,
        patient_records: await Patient.countDocuments()
      },
      sampleUserPatients,
      samplePatientRecords,
      message: patientCount === 0 
        ? "⚠️ No patients found in User model. Check if users have role: 'patient'"
        : `Found ${patientCount} patients in User model and ${await Patient.countDocuments()} patient records`
    });
    
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;