// routes/medicationPrescription.ts
import express from "express";
import jwt from "jsonwebtoken";
import { MedicationModel } from "../models/medicationModels";
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

// POST /api/medications/prescribe - Doctor prescribes medication to patient
router.post("/", authenticateUser, async (req: any, res: any) => {
  try {
    const {
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      reminders,
      startDate
    } = req.body;

    // Check if user is a doctor
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Only doctors can prescribe medications"
      });
    }

    // Validate required fields
    if (!patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, medicationName, dosage, frequency"
      });
    }

    console.log("=== PRESCRIBING MEDICATION ===");
    console.log("Doctor ID:", req.userId);
    console.log("Patient ID:", patientId);
    console.log("Medication:", medicationName);

    await connectMongoDB();

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Create new medication prescription
    const medication = new MedicationModel({
      patientId,
      medicationName,
      dosage,
      frequency,
      duration: duration || 'Ongoing',
      instructions: instructions || '',
      reminders: reminders || [],
      startDate: startDate || new Date(),
      prescribedBy: req.userId,
      status: 'active'
    });

    await medication.save();

    // Populate the response with patient and doctor info
    const populatedMedication = await MedicationModel.findById(medication._id)
      .populate('patientId', 'fullName email phoneNumber')
      .populate('prescribedBy', 'fullName specialization');

    console.log("✅ Medication prescribed successfully");

    res.status(201).json({
      success: true,
      message: "Medication prescribed successfully",
      data: populatedMedication
    });

  } catch (error: any) {
    console.error('Error prescribing medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to prescribe medication",
      error: error.message
    });
  }
});

// GET /api/medications/prescribe/my-prescriptions - Get medications prescribed by this doctor
router.get("/my-prescriptions", authenticateUser, async (req: any, res: any) => {
  try {
    // Check if user is a doctor
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access prescriptions"
      });
    }

    console.log("=== FETCHING DOCTOR'S PRESCRIPTIONS ===");
    console.log("Doctor ID:", req.userId);

    await connectMongoDB();

    const medications = await MedicationModel.find({ 
      prescribedBy: req.userId 
    })
    .populate('patientId', 'fullName email phoneNumber')
    .populate('prescribedBy', 'fullName specialization')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${medications.length} prescriptions`);

    res.json({
      success: true,
      data: medications
    });

  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message
    });
  }
});

export default router;