// ============================================
// FILE: apps/api/src/routes/medicationReminders.ts
// ============================================

import express from "express";
import jwt from "jsonwebtoken";
import { MedicationModel } from "../models/medicationModels";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
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

// ============================================
// DOCTOR ROUTES
// ============================================

/**
 * POST /api/medications/reminders/prescribe
 * Doctor prescribes medication to a patient
 */
router.post("/prescribe", authenticateUser, async (req: any, res: any) => {
  try {
    const {
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      startDate,
      reminders,
      patientAllergies,
      potentialSideEffects,
      medicationImage
    } = req.body;

    console.log("=== PRESCRIBING MEDICATION ===");
    console.log("Doctor ID:", req.userId);
    console.log("Patient ID:", patientId);
    console.log("Medication:", medicationName);
    console.log("Allergies count:", patientAllergies?.length || 0);
    console.log("Side effects count:", potentialSideEffects?.length || 0);

    // Validation
    if (!patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, medicationName, dosage, frequency"
      });
    }

    await connectMongoDB();

    const medication = new MedicationModel({
      patientId,
      prescribedBy: req.userId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      startDate: startDate || new Date(),
      reminders: reminders || [],
      patientAllergies: patientAllergies || [],
      potentialSideEffects: potentialSideEffects || [],
      status: 'active',
      adherence: {
        currentStatus: 'taken',
        history: []
      },
      experiencedSideEffects: [],
      takenHistory: []
    });

    await medication.save();

    console.log("✅ Medication prescribed successfully");
    console.log("Medication ID:", medication._id);

    res.json({
      success: true,
      message: "Medication prescribed successfully",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error prescribing medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to prescribe medication",
      error: error.message
    });
  }
});

// ============================================
// PATIENT ROUTES
// ============================================

// Define types for side effect objects
interface SideEffect {
  sideEffectName: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reportedAt: Date;
  notes?: string;
  intensity?: string;
  lastUpdated?: Date;
  toObject?: () => any;
}

// Define types for adherence history
interface AdherenceHistoryEntry {
  date: Date;
  status: string;
  reason?: string;
  notes?: string;
}

/**
 * POST /api/medications/reminders/:medicationId/mark-taken
 * Patient marks medication as taken
 */
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
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Update medication status and add taken timestamp
    medication.lastTaken = new Date();
    
    if (!medication.takenHistory) {
      medication.takenHistory = [];
    }
    
    medication.takenHistory.push({
      takenAt: new Date(),
      doseTime: new Date().toTimeString().slice(0, 5)
    });

    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'taken',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'taken';
    }

    // Add to adherence history
    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'taken'
    });

    await medication.save();

    console.log("✅ Medication marked as taken successfully");

    res.json({
      success: true,
      message: "Medication marked as taken",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error marking medication as taken:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as taken",
      error: error.message
    });
  }
});

/**
 * POST /api/medications/reminders/:medicationId/mark-missed
 * Patient marks medication as missed
 */
router.post("/:medicationId/mark-missed", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason } = req.body;

    console.log("=== MARKING MEDICATION AS MISSED ===");
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
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'missed',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'missed';
    }

    // Add to adherence history
    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'missed',
      reason: reason || ''
    });

    await medication.save();

    console.log("✅ Medication marked as missed");

    res.json({
      success: true,
      message: "Medication marked as missed",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error marking medication as missed:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as missed",
      error: error.message
    });
  }
});

/**
 * POST /api/medications/reminders/:medicationId/stop-taking
 * Patient reports they have stopped taking the medication
 */
router.post("/:medicationId/stop-taking", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason, notes, sideEffectsIntensity } = req.body;

    console.log("=== STOPPING MEDICATION ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);
    console.log("Reason:", reason);
    console.log("Side Effects Intensity:", sideEffectsIntensity);

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason for stopping is required"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Update medication status and adherence
    medication.status = 'stopped';
    
    // Initialize adherence if it doesn't exist
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'stopped',
        reasonForStopping: reason,
        stoppedAt: new Date(),
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'stopped';
      medication.adherence.reasonForStopping = reason;
      medication.adherence.stoppedAt = new Date();
    }

    // Add to adherence history
    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'stopped',
      reason: reason,
      notes: notes || ''
    });

    // If side effects intensity is provided, update experienced side effects
    if (sideEffectsIntensity && medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0) {
      // Update all reported side effects with the intensity
      medication.experiencedSideEffects = medication.experiencedSideEffects.map((effect: SideEffect) => ({
        ...(effect.toObject ? effect.toObject() : effect),
        intensity: sideEffectsIntensity,
        lastUpdated: new Date()
      }));
    }

    await medication.save();

    console.log("✅ Medication marked as stopped");

    // TODO: Notify the prescribing doctor
    // await notifyDoctorAboutStoppedMedication(medication.prescribedBy, medication, reason, sideEffectsIntensity);

    res.json({
      success: true,
      message: "Medication marked as stopped",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error stopping medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as stopped",
      error: error.message
    });
  }
});

/**
 * POST /api/medications/reminders/:medicationId/restart-taking
 * Patient restarts a previously stopped medication
 */
router.post("/:medicationId/restart-taking", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason } = req.body;

    console.log("=== RESTARTING MEDICATION ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId,
      status: 'stopped'
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Stopped medication not found or you don't have permission to access it"
      });
    }

    // Update medication status
    medication.status = 'active';
    
    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'taken',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'taken';
      medication.adherence.reasonForStopping = undefined;
      medication.adherence.stoppedAt = undefined;
    }

    // Add to adherence history
    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'taken',
      reason: reason || 'Restarted medication'
    });

    await medication.save();

    console.log("✅ Medication restarted successfully");

    res.json({
      success: true,
      message: "Medication restarted successfully",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error restarting medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to restart medication",
      error: error.message
    });
  }
});

/**
 * POST /api/medications/reminders/:medicationId/report-side-effect
 * Patient reports a side effect they're experiencing
 */
router.post("/:medicationId/report-side-effect", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { sideEffectName, severity, notes } = req.body;

    console.log("=== REPORTING SIDE EFFECT ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);
    console.log("Side Effect:", sideEffectName);
    console.log("Severity:", severity);

    // Validate required fields
    if (!sideEffectName) {
      return res.status(400).json({
        success: false,
        message: "Side effect name is required"
      });
    }

    // Validate severity if provided
    if (severity && !['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Severity must be mild, moderate, or severe"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Initialize experiencedSideEffects if it doesn't exist
    if (!medication.experiencedSideEffects) {
      medication.experiencedSideEffects = [];
    }

    // Check if this side effect was already reported
    const alreadyReported = medication.experiencedSideEffects.some(
      (se: SideEffect) => se.sideEffectName.toLowerCase() === sideEffectName.toLowerCase()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: "This side effect has already been reported"
      });
    }

    // Add the experienced side effect
    medication.experiencedSideEffects.push({
      sideEffectName,
      reportedAt: new Date(),
      severity: severity || 'mild',
      notes: notes || ''
    } as SideEffect);

    await medication.save();

    // Log severe side effects for potential doctor notification
    if (severity === 'severe') {
      console.log("⚠️ SEVERE SIDE EFFECT REPORTED");
      console.log("Patient ID:", req.userId);
      console.log("Medication:", medication.medicationName);
      console.log("Side Effect:", sideEffectName);
      // TODO: Implement notification system to alert prescribing doctor
      // Example: await notifyDoctor(medication.prescribedBy, { ... });
    }

    console.log("✅ Side effect reported successfully");

    res.json({
      success: true,
      message: "Side effect reported successfully",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error reporting side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to report side effect",
      error: error.message
    });
  }
});

/**
 * DELETE /api/medications/reminders/:medicationId/remove-side-effect
 * Patient removes/unchecks a reported side effect
 */
router.delete("/:medicationId/remove-side-effect", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { sideEffectName } = req.body;

    console.log("=== REMOVING SIDE EFFECT ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);
    console.log("Side Effect:", sideEffectName);

    if (!sideEffectName) {
      return res.status(400).json({
        success: false,
        message: "Side effect name is required"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Initialize experiencedSideEffects if it doesn't exist
    if (!medication.experiencedSideEffects) {
      medication.experiencedSideEffects = [];
    }

    // Remove the side effect (case-insensitive match)
    const initialLength = medication.experiencedSideEffects.length;
    medication.experiencedSideEffects = medication.experiencedSideEffects.filter(
      (se: SideEffect) => se.sideEffectName.toLowerCase() !== sideEffectName.toLowerCase()
    );

    // Check if anything was actually removed
    if (medication.experiencedSideEffects.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Side effect not found in reported list"
      });
    }

    await medication.save();

    console.log("✅ Side effect removed successfully");

    res.json({
      success: true,
      message: "Side effect removed successfully",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error removing side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to remove side effect",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/today
 * Get all active medications for today with reminders
 */
router.get("/today", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING TODAY'S MEDICATIONS ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const todayMedications = await MedicationModel.find({
      patientId: req.userId,
      status: { $in: ['active', 'stopped'] } // Include stopped medications
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ medicationName: 1 });

    console.log(`✅ Found ${todayMedications.length} medications`);

    // Log details for debugging
    todayMedications.forEach((med: any) => {
      console.log(`Medication: ${med.medicationName}`);
      console.log(`  - Status: ${med.status}`);
      console.log(`  - Allergies: ${med.patientAllergies?.length || 0}`);
      console.log(`  - Potential Side Effects: ${med.potentialSideEffects?.length || 0}`);
      console.log(`  - Experienced Side Effects: ${med.experiencedSideEffects?.length || 0}`);
    });

    res.json({
      success: true,
      data: todayMedications,
      count: todayMedications.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching today medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's medications",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/adherence-summary
 * Get patient's adherence summary
 */
router.get("/adherence-summary", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING ADHERENCE SUMMARY ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName status adherence lastTaken takenHistory');

    // Calculate adherence statistics
    let totalMedications = medications.length;
    let activeMedications = medications.filter(m => m.status === 'active').length;
    let stoppedMedications = medications.filter(m => m.status === 'stopped').length;
    
    // Calculate adherence rate for active medications
    let adherenceRate = 0;
    if (activeMedications > 0) {
      const takenCount = medications.filter(m => 
        m.status === 'active' && 
        m.adherence?.currentStatus === 'taken'
      ).length;
      adherenceRate = Math.round((takenCount / activeMedications) * 100);
    }

    // Get recently stopped medications
    const recentlyStopped = medications
      .filter(m => m.status === 'stopped')
      .sort((a: any, b: any) => new Date(b.adherence?.stoppedAt || 0).getTime() - new Date(a.adherence?.stoppedAt || 0).getTime())
      .slice(0, 5)
      .map((med: any) => ({
        medicationName: med.medicationName,
        stoppedAt: med.adherence?.stoppedAt,
        reason: med.adherence?.reasonForStopping
      }));

    console.log(`✅ Found ${totalMedications} medications, ${activeMedications} active, ${stoppedMedications} stopped`);

    res.json({
      success: true,
      data: {
        summary: {
          totalMedications,
          activeMedications,
          stoppedMedications,
          adherenceRate
        },
        recentlyStopped,
        medications: medications.map((med: any) => ({
          medicationName: med.medicationName,
          status: med.status,
          adherence: med.adherence?.currentStatus || 'unknown',
          lastTaken: med.lastTaken,
          takenCount: med.takenHistory?.length || 0,
          stoppedReason: med.adherence?.reasonForStopping
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching adherence summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adherence summary",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/due
 * Get medications that are due now (within current time window)
 */
router.get("/due", authenticateUser, async (req: any, res: any) => {
  try {
    const currentTime = new Date();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5); // Format: "HH:MM"

    console.log("=== FETCHING DUE MEDICATIONS ===");
    console.log("Patient ID:", req.userId);
    console.log("Current time:", currentTimeStr);

    await connectMongoDB();

    // Find medications where current time matches one of the reminder times
    const dueMedications = await MedicationModel.find({
      patientId: req.userId,
      status: 'active',
      reminders: { $in: [currentTimeStr] }
    })
    .populate('prescribedBy', 'fullName specialization');

    console.log(`✅ Found ${dueMedications.length} due medications`);

    res.json({
      success: true,
      data: dueMedications,
      count: dueMedications.length,
      currentTime: currentTimeStr
    });

  } catch (error: any) {
    console.error('❌ Error fetching due medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due medications",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/:medicationId
 * Get a specific medication with all details
 */
router.get("/:medicationId", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    console.log("=== FETCHING MEDICATION DETAILS ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    console.log("✅ Medication found");

    res.json({
      success: true,
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/history/taken
 * Get patient's medication history (all taken medications)
 */
router.get("/history/taken", authenticateUser, async (req: any, res: any) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    console.log("=== FETCHING MEDICATION HISTORY ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const query: any = {
      patientId: req.userId,
      lastTaken: { $exists: true }
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.lastTaken = {};
      if (startDate) query.lastTaken.$gte = new Date(startDate as string);
      if (endDate) query.lastTaken.$lte = new Date(endDate as string);
    }

    const medications = await MedicationModel.find(query)
      .populate('prescribedBy', 'fullName specialization')
      .sort({ lastTaken: -1 })
      .limit(Number(limit));

    console.log(`✅ Found ${medications.length} medication records`);

    res.json({
      success: true,
      data: medications,
      count: medications.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching medication history:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication history",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/side-effects/summary
 * Get summary of all reported side effects for the patient
 */
router.get("/side-effects/summary", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING SIDE EFFECTS SUMMARY ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: req.userId,
      'experiencedSideEffects.0': { $exists: true } // Has at least one side effect
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName experiencedSideEffects status adherence');

    // Aggregate side effects
    const sideEffectsSummary = medications.map(med => ({
      medicationName: med.medicationName,
      medicationId: med._id,
      status: med.status,
      stoppedReason: med.adherence?.reasonForStopping,
      sideEffects: med.experiencedSideEffects.map((se: SideEffect) => ({
        name: se.sideEffectName,
        severity: se.severity,
        reportedAt: se.reportedAt,
        notes: se.notes,
        intensity: se.intensity
      }))
    }));

    console.log(`✅ Found side effects for ${medications.length} medications`);

    res.json({
      success: true,
      data: sideEffectsSummary,
      totalMedicationsWithSideEffects: medications.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching side effects summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects summary",
      error: error.message
    });
  }
});

export default router;