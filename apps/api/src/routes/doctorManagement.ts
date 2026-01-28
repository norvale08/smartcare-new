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

    console.log("✅ Authenticated doctor:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/doctor/assigned-patients - Get all assigned patients for doctor
router.get("/assigned-patients", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;

    await connectMongoDB();

    const doctor = await User.findById(doctorId).populate('assignedPatients');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    const assignedPatients = (doctor.assignedPatients || []).map((patient: any) => ({
      id: patient._id.toString(),
      fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      age: calculateAge(patient.dob),
      gender: patient.gender || 'Unknown',
      condition: getPatientCondition(patient),
      lastVisit: patient.lastVisit || new Date().toISOString(),
      status: 'stable',
      phoneNumber: patient.phoneNumber,
      email: patient.email
    }));

    console.log(`✅ Found ${assignedPatients.length} assigned patients for doctor ${doctorId}`);

    res.status(200).json(assignedPatients);

  } catch (error: any) {
    console.error('Error fetching assigned patients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/doctor/pending-requests - Get all pending patient requests
router.get("/pending-requests", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;

    console.log("=== FETCHING PENDING REQUESTS ===");
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    const doctor = await User.findById(doctorId).populate('pendingRequests.patientId');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    const pendingRequests = (doctor.pendingRequests || [])
      .filter((req: any) => req.status === 'pending')
      .map((req: any) => ({
        requestId: req._id,
        patientId: req.patientId?._id || req.patientId,
        patientName: req.patientName || `${req.patientId?.firstName} ${req.patientId?.lastName}`,
        requestedAt: req.requestedAt,
        status: req.status
      }));

    console.log(`✅ Found ${pendingRequests.length} pending requests for doctor ${doctorId}`);

    res.status(200).json({ 
      success: true,
      pendingRequests,
      count: pendingRequests.length
    });

  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/doctor/accept-request - Accept a patient request
router.post("/accept-request", authenticateUser, async (req: any, res: any) => {
  try {
    const { patientId } = req.body;
    const doctorId = req.userId;

    console.log("=== ACCEPT PATIENT REQUEST ===");
    console.log("Doctor ID:", doctorId);
    console.log("Patient ID:", patientId);

    if (!patientId) {
      return res.status(400).json({ 
        success: false,
        message: "Patient ID is required" 
      });
    }

    await connectMongoDB();

    // Get doctor and patient
    const doctor = await User.findById(doctorId);
    const patient = await User.findById(patientId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    // Find the pending request
    const pendingRequestIndex = doctor.pendingRequests?.findIndex(
      (req: any) => req.patientId.toString() === patientId && req.status === 'pending'
    );

    if (pendingRequestIndex === -1 || !doctor.pendingRequests) {
      return res.status(404).json({ 
        success: false,
        message: "Pending request not found" 
      });
    }

    // Update request status to accepted
    doctor.pendingRequests[pendingRequestIndex].status = 'accepted';

    // Initialize assignedPatients array if it doesn't exist
    if (!doctor.assignedPatients) {
      doctor.assignedPatients = [];
    }

    // Add patient to assigned patients (if not already there)
    if (!doctor.assignedPatients.includes(patientId)) {
      doctor.assignedPatients.push(patientId);
    }

    await doctor.save();

    // Update patient's side
    if (patient.requestedDoctors) {
      // Remove this doctor from requested doctors
      patient.requestedDoctors = patient.requestedDoctors.filter(
        (docId: any) => docId.toString() !== doctorId
      );
    }

    // Set assigned doctor for patient
    patient.assignedDoctor = doctorId;
    await patient.save();

    console.log("✅ Patient request accepted successfully");

    res.status(200).json({ 
      success: true,
      message: "Patient request accepted successfully",
      patient: {
        id: patient._id,
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      }
    });

  } catch (error: any) {
    console.error('Accept request error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/doctor/reject-request - Reject a patient request
router.post("/reject-request", authenticateUser, async (req: any, res: any) => {
  try {
    const { patientId } = req.body;
    const doctorId = req.userId;

    console.log("=== REJECT PATIENT REQUEST ===");
    console.log("Doctor ID:", doctorId);
    console.log("Patient ID:", patientId);

    if (!patientId) {
      return res.status(400).json({ 
        success: false,
        message: "Patient ID is required" 
      });
    }

    await connectMongoDB();

    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    // Find and update the pending request status to rejected
    const pendingRequestIndex = doctor.pendingRequests?.findIndex(
      (req: any) => req.patientId.toString() === patientId && req.status === 'pending'
    );

    if (pendingRequestIndex !== -1 && doctor.pendingRequests) {
      doctor.pendingRequests[pendingRequestIndex].status = 'rejected';
      await doctor.save();
    }

    console.log("✅ Patient request rejected successfully");

    res.status(200).json({ 
      success: true,
      message: "Patient request rejected successfully"
    });

  } catch (error: any) {
    console.error('Reject request error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper function to calculate age from DOB
function calculateAge(dob: Date): number {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to determine patient condition
function getPatientCondition(patient: any): "hypertension" | "diabetes" | "both" {
  if (patient.hypertension && patient.diabetes) return "both";
  if (patient.hypertension) return "hypertension";
  if (patient.diabetes) return "diabetes";
  return "hypertension"; // default
}

export default router;