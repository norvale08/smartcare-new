// FILE: ./routes/adminPatients.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Patient from "../models/patient"; // Import Patient model
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

// GET /api/admin/patients - Get all patients for admin
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log("=== ADMIN FETCHING PATIENTS ===");
    
    await connectMongoDB();

    // First, count patients to debug
    const patientCount = await User.countDocuments({ role: "patient" });
    console.log(`Total patients in database: ${patientCount}`);

    // Get all patients with their assigned doctor
    const patients = await User.find({ role: "patient" })
      .populate({
        path: "assignedDoctor",
        select: "firstName lastName fullName email specialization",
        match: { role: "doctor" }
      })
      .select("firstName lastName fullName email phoneNumber assignedDoctor condition createdAt updatedAt")
      .sort({ fullName: 1 });

    console.log(`Found ${patients.length} patients in query`);

    // Get assignment source from Patient model for each user
    const formattedPatients = await Promise.all(
      patients.map(async (user: any) => {
        // Find corresponding Patient record
        const patientRecord = await Patient.findOne({ userId: user._id });
        
        let assignedDoctorInfo = null;
        if (user.assignedDoctor && user.assignedDoctor._id) {
          assignedDoctorInfo = {
            id: user.assignedDoctor._id.toString(),
            fullName: user.assignedDoctor.fullName || 
                     `${user.assignedDoctor.firstName} ${user.assignedDoctor.lastName}`,
            specialization: user.assignedDoctor.specialization || "General Medicine"
          };
        }

        return {
          id: user._id.toString(),
          fullName: user.fullName || `${user.firstName} ${user.lastName}`,
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          assignedDoctor: assignedDoctorInfo,
          assignmentSource: patientRecord?.assignmentSource || "unassigned",
          condition: user.condition || "hypertension"
        };
      })
    );

    console.log(`✅ Formatted ${formattedPatients.length} patients`);

    res.json({
      success: true,
      patients: formattedPatients,
      count: formattedPatients.length,
      debug: {
        totalInDatabase: patientCount,
        foundInQuery: patients.length,
        formatted: formattedPatients.length
      }
    });

  } catch (error: any) {
    console.error("❌ Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
      stack: error.stack
    });
  }
});

// Alternative: Get all patients directly from Patient model
router.get("/from-patient-model", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log("=== ADMIN FETCHING PATIENTS FROM PATIENT MODEL ===");
    
    await connectMongoDB();

    // Get all patients from Patient model with user info populated
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

    // Format patients
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

      return {
        id: patient.userId._id.toString(),
        fullName: patient.fullName || patient.userId.fullName || 
                 `${patient.userId.firstName} ${patient.userId.lastName}`,
        email: patient.email || patient.userId.email,
        phoneNumber: patient.phoneNumber || patient.userId.phoneNumber,
        assignedDoctor: assignedDoctorInfo,
        assignmentSource: patient.assignmentSource || "unassigned",
        condition: patient.userId.condition || "hypertension"
      };
    }).filter(Boolean); // Remove null entries

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

// Debug endpoint
router.get("/debug", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await connectMongoDB();
    
    // Count by role
    const patientCount = await User.countDocuments({ role: "patient" });
    const doctorCount = await User.countDocuments({ role: "doctor" });
    const adminCount = await User.countDocuments({ role: "admin" });
    
    // Get sample patients from User model
    const sampleUserPatients = await User.find({ role: "patient" })
      .select("_id firstName lastName email phoneNumber assignedDoctor condition")
      .limit(5);
    
    // Get sample patients from Patient model
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