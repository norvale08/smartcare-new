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

// Helper function to calculate end date
const calculateEndDate = (startDate: string | Date, duration: string): Date | null => {
  if (!startDate || !duration || duration.toLowerCase().trim() === 'ongoing') {
    return null;
  }

  const start = new Date(startDate);
  
  if (isNaN(start.getTime())) {
    return null;
  }
  
  const durationLower = duration.toLowerCase();
  const match = durationLower.match(/(\d+)/);
  
  if (!match || !match[1]) return null;

  const value = parseInt(match[1], 10);
  if (isNaN(value)) return null;

  if (durationLower.includes('day')) {
    start.setDate(start.getDate() + value);
  } else if (durationLower.includes('week')) {
    start.setDate(start.getDate() + (value * 7));
  } else if (durationLower.includes('month')) {
    start.setMonth(start.getMonth() + value);
  } else if (durationLower.includes('year')) {
    start.setFullYear(start.getFullYear() + value);
  } else {
    return null;
  }

  return start;
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
      startDate,
      patientAllergies,
      potentialSideEffects
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

    // Calculate end date
    const medStartDate = startDate || new Date();
    const endDate = calculateEndDate(medStartDate, duration || 'Ongoing');

    // Create new medication prescription
    const medication = new MedicationModel({
      patientId,
      medicationName,
      dosage,
      frequency,
      duration: duration || 'Ongoing',
      instructions: instructions || '',
      reminders: reminders || [],
      startDate: medStartDate,
      endDate: endDate,
      prescribedBy: req.userId,
      status: 'active',
      patientAllergies: patientAllergies || [],
      potentialSideEffects: potentialSideEffects || []
    });

    await medication.save();

    // Populate the response with patient and doctor info
    const populatedMedication = await MedicationModel.findById(medication._id)
      .populate('patientId', 'fullName email phoneNumber')
      .populate('prescribedBy', 'fullName specialization');

    console.log("✅ Medication prescribed successfully");
    console.log("End Date:", endDate);

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

// PUT /api/medications/prescribe/:medicationId - Update medication prescription
router.put("/:medicationId", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const {
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      reminders,
      startDate,
      patientAllergies,
      potentialSideEffects
    } = req.body;

    // Check if user is a doctor
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Only doctors can update medications"
      });
    }

    console.log("=== UPDATING MEDICATION ===");
    console.log("Doctor ID:", req.userId);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    // Find the medication
    const medication = await MedicationModel.findById(medicationId);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    // Verify the doctor is the one who prescribed it
    if (medication.prescribedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update medications you prescribed"
      });
    }

    // Calculate new end date if start date or duration changed
    const newStartDate = startDate || medication.startDate;
    const newDuration = duration || medication.duration;
    const endDate = calculateEndDate(newStartDate, newDuration);

    // Update medication fields
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (medicationName) updateFields.medicationName = medicationName;
    if (dosage) updateFields.dosage = dosage;
    if (frequency) updateFields.frequency = frequency;
    if (duration) updateFields.duration = duration;
    if (instructions !== undefined) updateFields.instructions = instructions;
    if (reminders) updateFields.reminders = reminders;
    if (startDate) updateFields.startDate = startDate;
    if (patientAllergies) updateFields.patientAllergies = patientAllergies;
    if (potentialSideEffects) updateFields.potentialSideEffects = potentialSideEffects;
    
    // Always update end date when start date or duration changes
    updateFields.endDate = endDate;

    const updatedMedication = await MedicationModel.findByIdAndUpdate(
      medicationId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'fullName email phoneNumber')
      .populate('prescribedBy', 'fullName specialization');

    console.log("✅ Medication updated successfully");
    console.log("New End Date:", endDate);

    res.json({
      success: true,
      message: "Medication updated successfully",
      data: updatedMedication
    });

  } catch (error: any) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update medication",
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

// GET /api/medications/prescribe/:medicationId - Get single medication details
router.get("/:medicationId", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    // Check if user is a doctor
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access medication details"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findById(medicationId)
      .populate('patientId', 'fullName email phoneNumber')
      .populate('prescribedBy', 'fullName specialization');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    // Verify the doctor is the one who prescribed it
    if (medication.prescribedBy._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view medications you prescribed"
      });
    }

    res.json({
      success: true,
      data: medication
    });

  } catch (error: any) {
    console.error('Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication",
      error: error.message
    });
  }
});

export default router;