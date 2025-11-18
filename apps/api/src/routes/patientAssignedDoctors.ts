// routes/patientAssignedDoctors.ts
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
    req.userRole = decoded.role;

    console.log("✅ Authenticated patient:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/patient/assigned-doctors - Get assigned doctor for this patient
router.get("/assigned-doctors", authenticateUser, async (req: any, res: any) => {
  try {
    const patientId = req.userId;

    console.log("=== FETCHING ASSIGNED DOCTOR ===");
    console.log("Patient ID:", patientId);

    await connectMongoDB();

    // Find patient and populate assignedDoctor
    const patient = await User.findById(patientId).populate('assignedDoctor');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    // Check if patient has an assigned doctor
    if (!patient.assignedDoctor) {
      console.log(`⚠️ No assigned doctor for patient ${patientId}`);
      return res.status(200).json({
        success: true,
        assignedDoctor: null,
        message: "No doctor assigned yet"
      });
    }

    // Format doctor data
    const doctor = patient.assignedDoctor;
    const assignedDoctor = {
      id: doctor._id.toString(),
      fullName: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
      specialization: doctor.specialization || 'General Medicine',
      hospital: doctor.hospital || 'Not specified',
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      licenseNumber: doctor.licenseNumber,
      experience: doctor.experience || 0,
      createdAt: doctor.createdAt
    };

    console.log(`✅ Found assigned doctor for patient ${patientId}: ${assignedDoctor.fullName}`);

    res.status(200).json({
      success: true,
      assignedDoctor: assignedDoctor
    });

  } catch (error: any) {
    console.error('Error fetching assigned doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/patient/request-doctor - Request a doctor (send request to doctor)
router.post("/request-doctor", authenticateUser, async (req: any, res: any) => {
  try {
    const patientId = req.userId;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    console.log("=== PATIENT REQUESTING DOCTOR ===");
    console.log("Patient ID:", patientId);
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    // Find both patient and doctor
    const patient = await User.findById(patientId);
    const doctor = await User.findById(doctorId);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if patient already has this doctor assigned
    if (patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId) {
      return res.status(400).json({ 
        message: "This doctor is already assigned to you" 
      });
    }

    // Check if request already pending
    if (doctor.pendingRequests && doctor.pendingRequests.some((id: any) => 
      id.toString() === patientId
    )) {
      return res.status(400).json({ 
        message: "Request already pending with this doctor" 
      });
    }

    // Add patient to doctor's pending requests
    if (!doctor.pendingRequests) {
      doctor.pendingRequests = [];
    }
    doctor.pendingRequests.push(patientId);
    await doctor.save();

    console.log("✅ Successfully sent doctor request");
    console.log(`Patient ${patientId} requested doctor ${doctorId}`);

    res.status(200).json({
      success: true,
      message: "Doctor request sent successfully",
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName
      }
    });

  } catch (error: any) {
    console.error('Error requesting doctor:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;