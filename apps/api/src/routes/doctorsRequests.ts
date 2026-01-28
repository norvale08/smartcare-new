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

    
    next();
  } catch (error) {
    console.error(" Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/doctor/pending-requests - Get all pending requests for this doctor
router.get("/pending-requests", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can access this endpoint" });
    }

    

    await connectMongoDB();

    // Find the doctor
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

   

    // Get pending requests that have status 'pending'
    const pendingRequests = (doctor.pendingRequests || [])
      .filter((request: any) => request.status === 'pending')
      .map((request: any) => ({
        _id: request._id,
        patientId: request.patientId,
        patientName: request.patientName,
        requestedAt: request.requestedAt,
        status: request.status
      }));

   
    res.status(200).json({
      success: true,
      pendingRequests: pendingRequests
    });

  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/doctor/accept-request - Accept a patient request
router.post("/accept-request", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.body;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can accept requests" });
    }

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

   

    await connectMongoDB();

    // Find both doctor and patient
    const doctor = await User.findById(doctorId);
    const patient = await User.findById(patientId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if patient is in pending requests
    const pendingRequest = doctor.pendingRequests?.find((req: any) => 
      req.patientId.toString() === patientId.toString() && req.status === 'pending'
    );

    if (!pendingRequest) {
      return res.status(400).json({ 
        message: "No pending request found from this patient" 
      });
    }

    // Update the request status to 'accepted'
    const requestIndex = doctor.pendingRequests?.findIndex((req: any) => 
      req.patientId.toString() === patientId.toString()
    );

    if (requestIndex !== -1 && doctor.pendingRequests) {
      doctor.pendingRequests[requestIndex].status = 'accepted';
    }

    // Add patient to assignedPatients
    if (!doctor.assignedPatients) {
      doctor.assignedPatients = [];
    }
    
    // Only add if not already assigned
    if (!doctor.assignedPatients.some((id: any) => id.toString() === patientId.toString())) {
      doctor.assignedPatients.push(patientId);
    }

    await doctor.save();

    // Update patient: set assignedDoctor and remove from requestedDoctors
    patient.assignedDoctor = doctorId;
    
    // Remove this doctor from patient's requestedDoctors
    if (patient.requestedDoctors) {
      patient.requestedDoctors = patient.requestedDoctors.filter(
        (docId: any) => docId.toString() !== doctorId.toString()
      );
    }

    await patient.save();

    
    res.status(200).json({
      success: true,
      message: "Patient request accepted successfully",
      doctor: {
        id: doctor._id,
        assignedPatientsCount: doctor.assignedPatients.length
      },
      patient: {
        id: patient._id,
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        assignedDoctor: patient.assignedDoctor
      }
    });

  } catch (error: any) {
    console.error('Error accepting request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/doctor/reject-request - Reject a patient request
router.post("/reject-request", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.body;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can reject requests" });
    }

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }


    await connectMongoDB();

    // Find doctor
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update the request status to 'rejected'
    const requestIndex = doctor.pendingRequests?.findIndex((req: any) => 
      req.patientId.toString() === patientId.toString() && req.status === 'pending'
    );

    if (requestIndex !== -1 && doctor.pendingRequests) {
      doctor.pendingRequests[requestIndex].status = 'rejected';
      await doctor.save();
    }

  
    res.status(200).json({
      success: true,
      message: "Patient request rejected"
    });

  } catch (error: any) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/doctor/assigned-patients - Get all assigned patients for this doctor
router.get("/assigned-patients", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can access this endpoint" });
    }

    await connectMongoDB();

    // Find the doctor and populate assigned patients
    const doctor = await User.findById(doctorId).populate('assignedPatients');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    

    // Format assigned patients
    const assignedPatients = (doctor.assignedPatients || []).map((patient: any) => ({
      id: patient._id.toString(),
      fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      age: patient.age || calculateAge(patient.dob),
      gender: patient.gender || 'Not specified',
      condition: getPatientCondition(patient),
      lastVisit: patient.lastVisit || patient.updatedAt || new Date().toISOString(),
      status: determinePatientStatus(patient),
      phoneNumber: patient.phoneNumber,
      email: patient.email
    }));

    

    res.status(200).json(assignedPatients);

  } catch (error: any) {
    console.error('Error fetching assigned patients:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper function to calculate age from date of birth
function calculateAge(dob: Date | string | undefined): number {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
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


function determinePatientStatus(patient: any): 'stable' | 'warning' | 'critical' {
  
  return 'stable';
}

export default router;