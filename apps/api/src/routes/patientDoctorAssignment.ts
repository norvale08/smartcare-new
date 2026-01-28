// FILE: ./routes/patientDoctorAssignment.ts
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Patient from "../models/patient";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Authentication middleware
const authenticateUser = (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/patient/my-doctor - Get assigned doctor for this patient (checks both models)
router.get("/my-doctor", authenticateUser, async (req: any, res: any) => {
  try {
    const patientId = req.userId;
    const userRole = req.userRole;

    if (userRole !== "patient") {
      return res.status(403).json({ 
        success: false,
        message: "Only patients can access this endpoint" 
      });
    }

    await connectMongoDB();

    let doctor = null;
    let assignmentSource = "unknown";
    
    // FIRST: Check Patient model (where admin assignments are stored)
    
    const patientRecord = await Patient.findOne({ userId: patientId })
      .populate({
        path: "doctorId",
        select: "firstName lastName fullName email phoneNumber specialization hospital licenseNumber experience createdAt"
      });

    if (patientRecord && patientRecord.doctorId) {
      
      doctor = patientRecord.doctorId;
      assignmentSource = patientRecord.assignmentSource || "admin";
    } else {
     
      
      // SECOND: Check User model (for backward compatibility)
      const user = await User.findById(patientId).populate('assignedDoctor');
      
      if (user && user.assignedDoctor) {

        doctor = user.assignedDoctor;
        assignmentSource = "user_model";
      }
    }

    if (!doctor) {
      
      return res.status(200).json({
        success: true,
        assignedDoctor: null,
        message: "No doctor assigned yet"
      });
    }

    // Format doctor data
    const assignedDoctor = {
      id: doctor._id.toString(),
      fullName: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
      specialization: doctor.specialization || 'General Medicine',
      hospital: doctor.hospital || 'Medical Center',
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      licenseNumber: doctor.licenseNumber,
      experience: doctor.experience || 0,
      createdAt: doctor.createdAt,
      assignmentSource: assignmentSource
    };



    res.status(200).json({
      success: true,
      assignedDoctor: assignedDoctor,
      assignmentSource: assignmentSource
    });

  } catch (error: any) {
    console.error(' Error fetching assigned doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;