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

    console.log("✅ Authenticated user:", decoded.userId, "Role:", decoded.role);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
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

    console.log("=== FETCHING PENDING REQUESTS ===");
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    // Find the doctor
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log("Doctor pendingRequests:", doctor.pendingRequests);

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

    console.log(`✅ Found ${pendingRequests.length} pending requests for doctor ${doctorId}`);

    return res.status(200).json({
      success: true,
      pendingRequests: pendingRequests
    });

  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ 
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

    console.log("=== ACCEPTING PATIENT REQUEST ===");
    console.log("Doctor ID:", doctorId);
    console.log("Patient ID:", patientId);

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

    console.log("✅ Successfully accepted patient request");
    console.log(`Doctor ${doctorId} now has patient ${patientId} assigned`);

    return res.status(200).json({
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
    return res.status(500).json({ 
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

    console.log("=== REJECTING PATIENT REQUEST ===");
    console.log("Doctor ID:", doctorId);
    console.log("Patient ID:", patientId);

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

    console.log("✅ Successfully rejected patient request");

    return res.status(200).json({
      success: true,
      message: "Patient request rejected"
    });

  } catch (error: any) {
    console.error('Error rejecting request:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ✅ FIXED: GET /api/doctor/assigned-patients - Get all assigned patients for this doctor
router.get("/assigned-patients", authenticateUser, async (req: any, res: any) => {
  try {
    const doctorId = req.userId;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can access this endpoint" });
    }

    console.log("=== FETCHING ASSIGNED PATIENTS ===");
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    // ✅ FIXED: Explicitly select fields including patientId and isApproved
    const doctor = await User.findById(doctorId).populate({
      path: 'assignedPatients',
      select: 'firstName lastName fullName email phoneNumber dob gender diabetes hypertension cardiovascular lastVisit updatedAt patientId isApproved age'
    });

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log(`✅ Found doctor with ${doctor.assignedPatients?.length || 0} assigned patients`);

    // ✅ FIXED: Added userId, patientId, and isApproved to response
    const assignedPatients = (doctor.assignedPatients || []).map((patient: any) => ({
      id: patient._id.toString(),
      userId: patient._id.toString(), // ✅ Added for consistency
      fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      age: patient.age || calculateAge(patient.dob),
      gender: patient.gender || 'Not specified',
      condition: getPatientCondition(patient),
      lastVisit: patient.lastVisit || patient.updatedAt || new Date().toISOString(),
      status: determinePatientStatus(patient),
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      patientId: patient.patientId || null, // ✅ CRITICAL: Added patientId
      isApproved: patient.isApproved || false // ✅ Added approval status
    }));

    // ✅ Added comprehensive debug logging
    console.log(`✅ Returning ${assignedPatients.length} assigned patients`);
    
    if (assignedPatients.length > 0) {
      console.log('📋 Sample patient data:', {
        fullName: assignedPatients[0].fullName,
        patientId: assignedPatients[0].patientId,
        email: assignedPatients[0].email,
        isApproved: assignedPatients[0].isApproved
      });
      
      // Log patientId for each patient
      assignedPatients.forEach((p: any, index: number) => {
        console.log(`  ${index + 1}. ${p.fullName} - patientId: ${p.patientId || 'NULL'}`);
      });
    }

    return res.status(200).json(assignedPatients); // ✅ Added return

  } catch (error: any) {
    console.error('❌ Error fetching assigned patients:', error);
    return res.status(500).json({ 
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

// Helper function to determine patient status based on recent vitals
function determinePatientStatus(patient: any): 'stable' | 'warning' | 'critical' {
  // This is a simplified status determination
  // In production, you'd check recent vitals from the database
  return 'stable';
}

export default router;