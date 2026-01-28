import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
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

    
    next();
  } catch (error) {
    console.error(" Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/patient/request-doctor
router.post("/request-doctor", authenticateUser, async (req: any, res: any) => {
  try {
    const { doctorId } = req.body;
    const patientId = req.userId;

    console.log("=== DOCTOR REQUEST REQUEST ===");
    console.log("Patient ID:", patientId);
    console.log("Doctor ID:", doctorId);

    if (!doctorId) {
      return res.status(400).json({ 
        success: false,
        message: "Doctor ID is required" 
      });
    }

    await connectMongoDB();

    // Get patient and doctor
    const patient = await User.findById(patientId);
    const doctor = await User.findById(doctorId);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    // Initialize requestedDoctors array if it doesn't exist
    if (!patient.requestedDoctors) {
      patient.requestedDoctors = [];
    }

    // Check if already requested
    if (patient.requestedDoctors.includes(doctorId)) {
      return res.status(400).json({ 
        success: false,
        message: "Doctor already requested" 
      });
    }

    // Add to requested doctors
    patient.requestedDoctors.push(doctorId);
    await patient.save();

    // Initialize pendingRequests array for doctor if it doesn't exist
    if (!doctor.pendingRequests) {
      doctor.pendingRequests = [];
    }

    // Add to doctor's pending requests
    doctor.pendingRequests.push({
      patientId: patientId,
      patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      requestedAt: new Date(),
      status: 'pending'
    });
    await doctor.save();

    
    res.status(200).json({ 
      success: true,
      message: "Doctor request sent successfully",
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName || `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization
      }
    });

  } catch (error: any) {
    console.error('Doctor request error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/patient/requested-doctors - Get all doctors requested by patient
router.get("/requested-doctors", authenticateUser, async (req: any, res: any) => {
  try {
    const patientId = req.userId;

    await connectMongoDB();

    const patient = await User.findById(patientId).populate('requestedDoctors');

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    const requestedDoctors = (patient.requestedDoctors || []).map((doctor: any) => ({
      id: doctor._id.toString(),
      fullName: doctor.fullName || `${doctor.firstName} ${doctor.lastName}`,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      status: 'pending' // You can track actual status from doctor's pendingRequests
    }));

    res.status(200).json({
      success: true,
      requestedDoctors
    });

  } catch (error: any) {
    console.error('Error fetching requested doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;