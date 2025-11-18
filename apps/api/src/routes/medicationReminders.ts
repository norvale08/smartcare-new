// routes/medicationReminders.ts
import express from "express";
import jwt from "jsonwebtoken";
import { MedicationModel } from "../models/medicationModels";
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

// POST /api/medications/reminders/:medicationId/mark-taken - Patient marks medication as taken
router.post("/:medicationId/mark-taken", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    console.log("=== MARKING MEDICATION AS TAKEN ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    // Update medication status and add taken timestamp
    medication.lastTaken = new Date();
    medication.takenHistory.push({
      takenAt: new Date(),
      doseTime: new Date().toTimeString().slice(0, 5)
    });

    await medication.save();

    console.log("✅ Medication marked as taken");

    res.json({
      success: true,
      message: "Medication marked as taken",
      data: medication
    });

  } catch (error: any) {
    console.error('Error marking medication as taken:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as taken",
      error: error.message
    });
  }
});

// GET /api/medications/reminders/due - Get due medications for patient
router.get("/due", authenticateUser, async (req: any, res: any) => {
  try {
    const currentTime = new Date();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);

    console.log("=== FETCHING DUE MEDICATIONS ===");
    console.log("Patient ID:", req.userId);
    console.log("Current time:", currentTimeStr);

    await connectMongoDB();

    const dueMedications = await MedicationModel.find({
      patientId: req.userId,
      status: 'active',
      reminders: { $in: [currentTimeStr] }
    })
    .populate('prescribedBy', 'fullName specialization');

    console.log(`✅ Found ${dueMedications.length} due medications`);

    res.json({
      success: true,
      data: dueMedications
    });

  } catch (error: any) {
    console.error('Error fetching due medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due medications",
      error: error.message
    });
  }
});

// GET /api/medications/reminders/today - Get all medications for today with reminders
router.get("/today", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING TODAY'S MEDICATIONS ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const todayMedications = await MedicationModel.find({
      patientId: req.userId,
      status: 'active'
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ medicationName: 1 });

    console.log(`✅ Found ${todayMedications.length} active medications`);

    res.json({
      success: true,
      data: todayMedications
    });

  } catch (error: any) {
    console.error('Error fetching today medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's medications",
      error: error.message
    });
  }
});

export default router;