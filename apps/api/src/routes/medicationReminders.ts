// FILE: apps/api/src/routes/medicationReminders.ts
import express from "express";
import jwt from "jsonwebtoken";
import { MedicationModel } from "../models/medicationModels";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Helper function to convert Map to object
const mapToObject = (map: any): any => {
  if (!map) return {};
  if (map instanceof Map) {
    const obj: any = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return map;
};

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


interface SideEffect {
  sideEffectName: string;
  severity?: "mild" | "moderate" | "severe";
  reportedAt: Date;
  notes?: string;
  intensity?: string;
  lastUpdated?: Date;
  toObject?: () => any; 
}

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
      takenHistory: [],
      weeklyAdherence: {}
    });

    await medication.save();

   

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
// PATIENT ROUTES WITH WEEKLY TRACKING
// ============================================

interface WeekDay {
  name: string;
  date: string;        // YYYY-MM-DD
  formatted: string;   // e.g. Mon, Sep 16
  isToday: boolean;
  isPast: boolean;
}

interface WeeklyMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  patientAllergies: any[];
  experiencedSideEffects: any[];
  weeklyData: {
    [date: string]: {
      taken: boolean;
      status: 'pending' | 'taken' | 'missed' | 'stopped';
      takenTime: string | null;
      isToday: boolean;
      isPast: boolean;
    };
  };
}

/**
 * GET /api/medications/reminders/weekly-adherence
 * Get medication adherence for the current week with day-by-day tracking
 */
router.get("/weekly-adherence", authenticateUser, async (req: any, res: any) => {
  try {
    const { weekStart } = req.query;
    
    
    await connectMongoDB();

    // Calculate start and end of week
    const today = new Date();
    let currentWeekStart: Date;
    
    if (weekStart && typeof weekStart === 'string' && weekStart.trim() !== '') {
      currentWeekStart = new Date(weekStart);
      currentWeekStart.setHours(0, 0, 0, 0);
    } else {
      currentWeekStart = new Date(today);
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);
    }
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Get all medications for the patient
    const medications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName dosage frequency status adherence takenHistory weeklyAdherence patientAllergies experiencedSideEffects');

    // Format days of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDays: WeekDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      weekDays.push({
        name: daysOfWeek[i],
        date: dateStr,
        formatted: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: dateStr === todayStr,
        isPast: day < today
      });
    }

    // Process each medication for weekly adherence
    const weeklyAdherence: WeeklyMedication[] = medications.map(medication => {
      const medAdherence: WeeklyMedication = {
        medicationId: medication._id.toString(),
        medicationName: medication.medicationName,
        dosage: medication.dosage,
        frequency: medication.frequency,
        status: medication.status,
        patientAllergies: medication.patientAllergies || [],
        experiencedSideEffects: medication.experiencedSideEffects || [],
        weeklyData: {}
      };

      // Initialize weekly data structure
      weekDays.forEach(day => {
        medAdherence.weeklyData[day.date] = {
          taken: false,
          status: 'pending' as 'pending' | 'taken' | 'missed' | 'stopped',
          takenTime: null,
          isToday: day.isToday,
          isPast: day.isPast
        };
      });

      // Check taken history for this week
      if (medication.takenHistory && medication.takenHistory.length > 0) {
        medication.takenHistory.forEach((entry: any) => {
          const takenDate = new Date(entry.takenAt);
          const takenDateStr = takenDate.toISOString().split('T')[0];
          
          if (takenDate >= currentWeekStart && takenDate <= currentWeekEnd) {
            if (medAdherence.weeklyData[takenDateStr]) {
              medAdherence.weeklyData[takenDateStr] = {
                taken: true,
                status: 'taken',
                takenTime: entry.doseTime || takenDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isToday: takenDateStr === today.toISOString().split('T')[0],
                isPast: takenDate < today
              };
            }
          }
        });
      }

      // Check weeklyAdherence field
      if (medication.weeklyAdherence) {
        let weeklyAdherenceData = mapToObject(medication.weeklyAdherence);
        
        Object.entries(weeklyAdherenceData).forEach(([dateKey, value]: [string, any]) => {
          try {
            const date = new Date(dateKey);
            if (date >= currentWeekStart && date <= currentWeekEnd) {
              if (medAdherence.weeklyData[dateKey]) {
                const valueObj = value.toObject ? value.toObject() : value;
                medAdherence.weeklyData[dateKey] = {
                  ...medAdherence.weeklyData[dateKey],
                  ...valueObj
                };
              }
            }
          } catch (error) {
            console.log("Error processing date:", dateKey, error);
          }
        });
      }

      // For active medications, mark past days as missed if not taken
      if (medication.status === 'active') {
        weekDays.forEach(day => {
          if (day.isPast && !medAdherence.weeklyData[day.date].taken) {
            medAdherence.weeklyData[day.date].status = 'missed';
          }
        });
      }

      // For stopped medications, mark all days as stopped
      if (medication.status === 'stopped') {
        weekDays.forEach(day => {
          medAdherence.weeklyData[day.date].status = 'stopped';
        });
      }

      return medAdherence;
    });

    // console.log(`✅ Weekly adherence data processed for ${weeklyAdherence.length} medications`);

    // Calculate summary
    const activeMedications = medications.filter(m => m.status === 'active').length;
    const takenThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => day.taken).length;
    }, 0);
    const missedThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => day.status === 'missed').length;
    }, 0);
    const pendingThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => 
        day.status === 'pending' && !day.isPast
      ).length;
    }, 0);

    const response = {
      success: true,
      data: {
        weekStart: currentWeekStart.toISOString(),
        weekEnd: currentWeekEnd.toISOString(),
        weekDays,
        medications: weeklyAdherence,
        summary: {
          totalMedications: medications.length,
          activeMedications,
          takenThisWeek,
          missedThisWeek,
          pendingThisWeek
        }
      }
    };

    // console.log("Weekly adherence response summary:", {
    //   medications: response.data.medications.length,
    //   weekDays: response.data.weekDays.length,
    //   summary: response.data.summary
    // });

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error fetching weekly adherence:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly adherence data",
      error: error.message
    });
  }
});

/**
 * POST /api/medications/reminders/:medicationId/mark-taken
 * Mark medication as taken with weekly tracking
 */
router.post("/:medicationId/mark-taken", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { dayDate } = req.body;

    // console.log("=== MARKING MEDICATION AS TAKEN ===");
    // console.log("Patient ID:", req.userId);
    // console.log("Medication ID:", medicationId);

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

    let takenDate: Date;
    if (dayDate && typeof dayDate === 'string') {
      const parsedDate = new Date(dayDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD format."
        });
      }
      takenDate = parsedDate;
    } else {
      takenDate = new Date();
    }

    const dateKey = takenDate.toISOString().split('T')[0];
    const currentTime = takenDate.toTimeString().slice(0, 5);

    // Update medication status
    medication.lastTaken = takenDate;
    
    if (!medication.takenHistory) {
      medication.takenHistory = [];
    }
    
    medication.takenHistory.push({
      takenAt: takenDate,
      doseTime: currentTime
    });

    // Update weekly adherence
    if (!medication.weeklyAdherence) {
      medication.weeklyAdherence = new Map();
    }
    
    medication.weeklyAdherence.set(dateKey, {
      taken: true,
      status: 'taken',
      takenTime: currentTime,
      markedAt: new Date()
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

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: takenDate,
      status: 'taken'
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as taken",
      data: {
        medicationId: medication._id,
        date: dateKey,
        status: 'taken',
        takenTime: currentTime,
        weeklyAdherence: mapToObject(medication.weeklyAdherence)
      }
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
 * Mark medication as missed with weekly tracking
 */
router.post("/:medicationId/mark-missed", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason, dayDate } = req.body;

    // console.log("=== MARKING MEDICATION AS MISSED ===");
    // console.log("Patient ID:", req.userId);
    // console.log("Medication ID:", medicationId);

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

    let missedDate: Date;
    if (dayDate && typeof dayDate === 'string') {
      const parsedDate = new Date(dayDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD format."
        });
      }
      missedDate = parsedDate;
    } else {
      missedDate = new Date();
    }

    const dateKey = missedDate.toISOString().split('T')[0];

    // Update weekly adherence
    if (!medication.weeklyAdherence) {
      medication.weeklyAdherence = new Map();
    }
    
    medication.weeklyAdherence.set(dateKey, {
      taken: false,
      status: 'missed',
      reason: reason || '',
      markedAt: new Date()
    });

    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'missed',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'missed';
    }

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: missedDate,
      status: 'missed',
      reason: reason || ''
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as missed",
      data: {
        medicationId: medication._id,
        date: dateKey,
        status: 'missed'
      }
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
 * Patient stops taking medication
 */
router.post("/:medicationId/stop-taking", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason, notes, sideEffectsIntensity } = req.body;

    console.log("=== STOPPING MEDICATION ===");
    console.log("Patient ID:", req.userId);
    console.log("Medication ID:", medicationId);
    console.log("Reason:", reason);

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

    // Update medication
    medication.status = 'stopped';
    
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

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'stopped',
      reason: reason,
      notes: notes || ''
    });

    // Update side effects intensity if provided
   if (
  sideEffectsIntensity &&
  medication.experiencedSideEffects &&
  medication.experiencedSideEffects.length > 0
) {
  medication.experiencedSideEffects = medication.experiencedSideEffects.map(
    (effect: SideEffect) => ({
      ...(effect.toObject ? effect.toObject() : effect),
      intensity: sideEffectsIntensity,
      lastUpdated: new Date()
    })
  );
}


    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as stopped. Your doctor has been notified.",
      data: {
        medication: medication,
        stoppedInfo: {
          reason: reason,
          notes: notes,
          sideEffectsIntensity: sideEffectsIntensity,
          stoppedAt: new Date()
        }
      }
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

// ============================================
// SIDE EFFECTS MANAGEMENT - UPDATED
// ============================================

/**
 * POST /api/medications/reminders/:medicationId/report-side-effect
 * Report side effect with improved note handling
 */
router.post("/:medicationId/report-side-effect", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { sideEffectName, severity, notes, intensity } = req.body;

    // console.log("=== REPORTING SIDE EFFECT ===");
    // console.log("Patient ID:", req.userId);
    // console.log("Medication ID:", medicationId);
    // console.log("Side Effect:", sideEffectName);
    // console.log("Notes:", notes);
    // console.log("Intensity:", intensity);

    if (!sideEffectName) {
      return res.status(400).json({
        success: false,
        message: "Side effect name is required"
      });
    }

    if (severity && !['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Severity must be mild, moderate, or severe"
      });
    }

    if (intensity && !['mild', 'moderate', 'severe', 'very severe'].includes(intensity)) {
      return res.status(400).json({
        success: false,
        message: "Intensity must be mild, moderate, severe, or very severe"
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

    if (!medication.experiencedSideEffects) {
      medication.experiencedSideEffects = [];
    }

    // Check if side effect already exists
    const existingEffectIndex = medication.experiencedSideEffects.findIndex(
      (se: any) => se.sideEffectName.toLowerCase() === sideEffectName.toLowerCase()
    );

    if (existingEffectIndex !== -1) {
      // Update existing side effect
      const existingEffect = medication.experiencedSideEffects[existingEffectIndex];
      medication.experiencedSideEffects[existingEffectIndex] = {
        ...existingEffect.toObject ? existingEffect.toObject() : existingEffect,
        severity: severity || existingEffect.severity,
        notes: notes || existingEffect.notes,
        intensity: intensity || existingEffect.intensity,
        lastUpdated: new Date()
      };
    } else {
      // Add new side effect
      medication.experiencedSideEffects.push({
        sideEffectName,
        reportedAt: new Date(),
        severity: severity || 'mild',
        notes: notes || '',
        intensity: intensity || 'moderate',
        resolved: false,
        lastUpdated: new Date()
      });
    }

    await medication.save();

    if (severity === 'severe') {
      // Log severe side effect - keeping this one as it's important for debugging
      console.log("⚠️ SEVERE SIDE EFFECT REPORTED - Doctor should be notified");
    }

    res.json({
      success: true,
      message: "Side effect reported successfully",
      data: medication.experiencedSideEffects
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
 * PUT /api/medications/reminders/:medicationId/side-effects/:effectId/doctor-update
 * Doctor updates side effect status
 */
router.put("/:medicationId/side-effects/:effectId/doctor-update", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId, effectId } = req.params;
    const { resolved, doctorNotes } = req.body;

    console.log("=== DOCTOR UPDATING SIDE EFFECT ===");
    console.log("Doctor ID:", req.userId);
    console.log("Medication ID:", medicationId);
    console.log("Effect ID:", effectId);

    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      prescribedBy: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you are not the prescribing doctor"
      });
    }

    if (!medication.experiencedSideEffects || medication.experiencedSideEffects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No side effects found for this medication"
      });
    }

    // Find the side effect (using index since effectId is not stored as _id)
    const effectIndex = parseInt(effectId);
    if (isNaN(effectIndex) || effectIndex < 0 || effectIndex >= medication.experiencedSideEffects.length) {
      return res.status(404).json({
        success: false,
        message: "Side effect not found"
      });
    }

    const effect = medication.experiencedSideEffects[effectIndex];
    
    // Update the side effect
    medication.experiencedSideEffects[effectIndex] = {
      ...(effect.toObject ? effect.toObject() : effect),
      resolved: resolved !== undefined ? resolved : effect.resolved,
      doctorNotes: doctorNotes || effect.doctorNotes,
      doctorId: req.userId,
      resolvedAt: resolved ? new Date() : effect.resolvedAt,
      lastUpdated: new Date()
    };

    await medication.save();

    console.log("✅ Side effect updated by doctor");

    res.json({
      success: true,
      message: "Side effect updated successfully",
      data: medication.experiencedSideEffects[effectIndex]
    });

  } catch (error: any) {
    console.error('❌ Error updating side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update side effect",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/:medicationId/side-effects
 * Get all side effects for a medication with details
 */
router.get("/:medicationId/side-effects", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    console.log("=== FETCHING SIDE EFFECTS ===");
    console.log("User ID:", req.userId);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    let medication;
    
    if (req.userRole === 'doctor') {
      // Doctor can see all medications they prescribed
      medication = await MedicationModel.findOne({
        _id: medicationId,
        prescribedBy: req.userId
      }).populate('patientId', 'fullName email');
    } else {
      // Patient can only see their own
      medication = await MedicationModel.findOne({
        _id: medicationId,
        patientId: req.userId
      });
    }

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    console.log("✅ Found side effects:", medication.experiencedSideEffects?.length || 0);

    res.json({
      success: true,
      data: {
        medicationId: medication._id,
        medicationName: medication.medicationName,
        patientId: medication.patientId,
        sideEffects: medication.experiencedSideEffects || []
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching side effects:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects",
      error: error.message
    });
  }
});

// ============================================
// DOCTOR VIEWS - UPDATED
// ============================================

/**
 * GET /api/medications/reminders/doctor-view/:patientId
 * Doctor view of patient medications with detailed side effects
 */
router.get("/doctor-view/:patientId", authenticateUser, async (req: any, res: any) => {
  try {
    const { patientId } = req.params;

    console.log("=== DOCTOR VIEWING PATIENT MEDICATIONS ===");
    console.log("Doctor ID:", req.userId);
    console.log("Patient ID:", patientId);

    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: patientId,
      prescribedBy: req.userId
    })
    .populate('patientId', 'fullName email phone')
    .populate('prescribedBy', 'fullName specialization')
    .sort({ status: 1, medicationName: 1 });

    const formattedMedications = medications.map((med, index) => ({
      _id: med._id,
      medicationName: med.medicationName,
      dosage: med.dosage,
      frequency: med.frequency,
      status: med.status,
      startDate: med.startDate,
      lastTaken: med.lastTaken,
      adherence: {
        currentStatus: med.adherence?.currentStatus,
        reasonForStopping: med.adherence?.reasonForStopping,
        stoppedAt: med.adherence?.stoppedAt,
        history: med.adherence?.history || []
      },
      experiencedSideEffects: (med.experiencedSideEffects || []).map((effect: any, effectIndex: number) => ({
        ...(effect.toObject ? effect.toObject() : effect),
        effectId: effectIndex, // Add index as ID for reference
        hasDoctorNotes: !!effect.doctorNotes,
        resolved: effect.resolved || false
      })),
      weeklyAdherence: mapToObject(med.weeklyAdherence),
      takenHistoryCount: med.takenHistory?.length || 0,
      patientAllergies: med.patientAllergies || [],
      potentialSideEffects: med.potentialSideEffects || [],
      patient: med.patientId,
      prescribedBy: med.prescribedBy,
      // Add summary for doctor
      summary: {
        totalSideEffects: (med.experiencedSideEffects || []).length,
        severeSideEffects: (med.experiencedSideEffects || []).filter((e: any) => 
          e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
        ).length,
        unresolvedSideEffects: (med.experiencedSideEffects || []).filter((e: any) => !e.resolved).length
      }
    }));

    console.log(`✅ Found ${medications.length} medications for patient ${patientId}`);

    // Calculate overall patient summary
    const overallSummary = {
      totalMedications: medications.length,
      active: medications.filter(m => m.status === 'active').length,
      stopped: medications.filter(m => m.status === 'stopped').length,
      completed: medications.filter(m => m.status === 'completed').length,
      totalSideEffects: medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
      severeSideEffects: medications.reduce((sum, m) => sum + 
        (m.experiencedSideEffects?.filter((e: any) => 
          e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
        ).length || 0), 0),
      recentStopped: medications
        .filter(m => m.status === 'stopped')
        .sort((a: any, b: any) => 
          new Date(b.adherence?.stoppedAt || 0).getTime() - new Date(a.adherence?.stoppedAt || 0).getTime()
        )
        .slice(0, 5)
        .map((med: any) => ({
          medicationName: med.medicationName,
          stoppedAt: med.adherence?.stoppedAt,
          reason: med.adherence?.reasonForStopping
        }))
    };

    res.json({
      success: true,
      data: {
        medications: formattedMedications,
        summary: overallSummary,
        patient: medications[0]?.patientId || null
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching medications for doctor view:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient medications",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/stopped-summary
 * Doctor dashboard summary of stopped medications with side effects
 */
router.get("/stopped-summary", authenticateUser, async (req: any, res: any) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    console.log("=== FETCHING STOPPED MEDICATIONS SUMMARY ===");
    console.log("Doctor ID:", req.userId);

    await connectMongoDB();

    const stoppedMedications = await MedicationModel.find({
      prescribedBy: req.userId,
      status: 'stopped'
    })
    .populate('patientId', 'fullName email')
    .sort({ 'adherence.stoppedAt': -1 })
    .select('medicationName dosage patientId adherence experiencedSideEffects');

    const reasonsSummary: {[key: string]: number} = {};
    const sideEffectsByReason: {[key: string]: any[]} = {};

    stoppedMedications.forEach(med => {
      const reason = med.adherence?.reasonForStopping || 'Unknown';
      reasonsSummary[reason] = (reasonsSummary[reason] || 0) + 1;
      
      if (med.experiencedSideEffects && med.experiencedSideEffects.length > 0) {
        if (!sideEffectsByReason[reason]) {
          sideEffectsByReason[reason] = [];
        }
        sideEffectsByReason[reason].push(...med.experiencedSideEffects);
      }
    });

    const medicationsWithDetails = stoppedMedications.map(med => ({
      medicationName: med.medicationName,
      dosage: med.dosage,
      patient: med.patientId,
      reason: med.adherence?.reasonForStopping,
      stoppedAt: med.adherence?.stoppedAt,
      sideEffects: med.experiencedSideEffects?.map((se: any) => ({
        name: se.sideEffectName,
        severity: se.severity,
        intensity: se.intensity,
        notes: se.notes,
        reportedAt: se.reportedAt,
        resolved: se.resolved
      })) || [],
      totalSideEffects: med.experiencedSideEffects?.length || 0
    }));

    res.json({
      success: true,
      data: {
        totalStopped: stoppedMedications.length,
        medications: medicationsWithDetails,
        reasonsSummary,
        sideEffectsByReason,
        recentStops: stoppedMedications.slice(0, 10)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching stopped medications summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stopped medications summary",
      error: error.message
    });
  }
});

/**
 * GET /api/medications/reminders/side-effects/doctor-summary
 * Doctor view of all side effects across patients
 */
router.get("/side-effects/doctor-summary", authenticateUser, async (req: any, res: any) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    console.log("=== FETCHING SIDE EFFECTS DOCTOR SUMMARY ===");
    console.log("Doctor ID:", req.userId);

    await connectMongoDB();

    const medications = await MedicationModel.find({
      prescribedBy: req.userId,
      'experiencedSideEffects.0': { $exists: true }
    })
    .populate('patientId', 'fullName email')
    .select('medicationName patientId experiencedSideEffects status');

    const allSideEffects: any[] = [];
    medications.forEach(med => {
      if (med.experiencedSideEffects && med.experiencedSideEffects.length > 0) {
        med.experiencedSideEffects.forEach((effect: any, index: number) => {
          allSideEffects.push({
            ...(effect.toObject ? effect.toObject() : effect),
            medicationId: med._id,
            medicationName: med.medicationName,
            patient: med.patientId,
            patientId: med.patientId?._id,
            status: med.status,
            effectIndex: index
          });
        });
      }
    });

    // Group by severity
    const bySeverity = {
      severe: allSideEffects.filter(se => 
        se.severity === 'severe' || se.intensity === 'severe' || se.intensity === 'very severe'
      ),
      moderate: allSideEffects.filter(se => 
        se.severity === 'moderate' || se.intensity === 'moderate'
      ),
      mild: allSideEffects.filter(se => 
        se.severity === 'mild' || se.intensity === 'mild'
      )
    };

    // Group by medication
    const byMedication: {[key: string]: any[]} = {};
    allSideEffects.forEach(se => {
      const key = se.medicationName;
      if (!byMedication[key]) {
        byMedication[key] = [];
      }
      byMedication[key].push(se);
    });

    // Unresolved side effects
    const unresolved = allSideEffects.filter(se => !se.resolved);

    res.json({
      success: true,
      data: {
        totalSideEffects: allSideEffects.length,
        totalPatients: [...new Set(allSideEffects.map(se => se.patientId))].length,
        totalMedications: medications.length,
        bySeverity,
        byMedication,
        unresolvedCount: unresolved.length,
        unresolved,
        recentSideEffects: allSideEffects
          .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
          .slice(0, 20)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching side effects doctor summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects summary",
      error: error.message
    });
  }
});

// ============================================
// EXISTING ROUTES (Keep as is)
// ============================================

/**
 * POST /api/medications/reminders/:medicationId/restart-taking
 * Patient restarts stopped medication
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

    medication.status = 'active';
    
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

    // Clear future weekly adherence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (medication.weeklyAdherence) {
      medication.weeklyAdherence.forEach((value: any, key: string) => {
        const date = new Date(key);
        if (date >= today) {
          medication.weeklyAdherence.delete(key);
        }
      });
    }

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
 * GET /api/medications/reminders/today
 * Get today's medications
 */
router.get("/today", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING TODAY'S MEDICATIONS ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const todayMedications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ medicationName: 1 });

    console.log(`✅ Found ${todayMedications.length} medications`);

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
 * Get adherence summary
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
    .select('medicationName status adherence lastTaken takenHistory experiencedSideEffects');

    let totalMedications = medications.length;
    let activeMedications = medications.filter(m => m.status === 'active').length;
    let stoppedMedications = medications.filter(m => m.status === 'stopped').length;
    
    let adherenceRate = 0;
    if (activeMedications > 0) {
      const takenCount = medications.filter(m => 
        m.status === 'active' && 
        m.adherence?.currentStatus === 'taken'
      ).length;
      adherenceRate = Math.round((takenCount / activeMedications) * 100);
    }

    // Count side effects
    const totalSideEffects = medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0);
    const severeSideEffects = medications.reduce((sum, m) => sum + 
      (m.experiencedSideEffects?.filter((e: any) => 
        e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
      ).length || 0), 0);

    const recentlyStopped = medications
      .filter(m => m.status === 'stopped')
      .sort((a: any, b: any) => new Date(b.adherence?.stoppedAt || 0).getTime() - new Date(a.adherence?.stoppedAt || 0).getTime())
      .slice(0, 5)
      .map((med: any) => ({
        medicationName: med.medicationName,
        stoppedAt: med.adherence?.stoppedAt,
        reason: med.adherence?.reasonForStopping,
        sideEffectsCount: med.experiencedSideEffects?.length || 0
      }));

    console.log(`✅ Found ${totalMedications} medications`);

    res.json({
      success: true,
      data: {
        summary: {
          totalMedications,
          activeMedications,
          stoppedMedications,
          adherenceRate,
          totalSideEffects,
          severeSideEffects
        },
        recentlyStopped,
        medications: medications.map((med: any) => ({
          medicationName: med.medicationName,
          status: med.status,
          adherence: med.adherence?.currentStatus || 'unknown',
          lastTaken: med.lastTaken,
          takenCount: med.takenHistory?.length || 0,
          stoppedReason: med.adherence?.reasonForStopping,
          sideEffectsCount: med.experiencedSideEffects?.length || 0,
          severeSideEffectsCount: med.experiencedSideEffects?.filter((e: any) => 
            e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
          ).length || 0
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
 * Get due medications
 */
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
 * Get specific medication
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
 * Get taken history
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
 * Get side effects summary for patient
 */
router.get("/side-effects/summary", authenticateUser, async (req: any, res: any) => {
  try {
    console.log("=== FETCHING SIDE EFFECTS SUMMARY ===");
    console.log("Patient ID:", req.userId);

    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: req.userId,
      'experiencedSideEffects.0': { $exists: true }
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName experiencedSideEffects status adherence');

    const sideEffectsSummary = medications.map(med => ({
      medicationName: med.medicationName,
      medicationId: med._id,
      status: med.status,
      stoppedReason: med.adherence?.reasonForStopping,
      sideEffects: (med.experiencedSideEffects || []).map((se: any) => ({
        name: se.sideEffectName,
        severity: se.severity,
        intensity: se.intensity,
        reportedAt: se.reportedAt,
        notes: se.notes,
        resolved: se.resolved || false,
        doctorNotes: se.doctorNotes,
        hasDoctorNotes: !!se.doctorNotes
      }))
    }));

    console.log(`✅ Found side effects for ${medications.length} medications`);

    res.json({
      success: true,
      data: {
        summary: sideEffectsSummary,
        totalMedicationsWithSideEffects: medications.length,
        totalSideEffects: medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
        unresolvedSideEffects: medications.reduce((sum, m) => 
          sum + (m.experiencedSideEffects?.filter((e: any) => !e.resolved).length || 0), 0),
        severeSideEffects: medications.reduce((sum, m) => 
          sum + (m.experiencedSideEffects?.filter((e: any) => 
            e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
          ).length || 0), 0)
      }
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

/**
 * DELETE /api/medications/reminders/:medicationId/remove-side-effect
 * Remove side effect
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

    if (!medication.experiencedSideEffects) {
      medication.experiencedSideEffects = [];
    }

    const initialLength = medication.experiencedSideEffects.length;
    medication.experiencedSideEffects = medication.experiencedSideEffects.filter(
      (se: any) => se.sideEffectName.toLowerCase() !== sideEffectName.toLowerCase()
    );

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
 * DELETE /api/medications/reminders/:medicationId
 * Delete medication (can be used by both doctor and patient with proper permissions)
 */
router.delete("/:medicationId", authenticateUser, async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    console.log("=== DELETING MEDICATION ===");
    console.log("User ID:", req.userId);
    console.log("User Role:", req.userRole);
    console.log("Medication ID:", medicationId);

    await connectMongoDB();

    let medication;
    
    if (req.userRole === 'doctor') {
      // Doctor can delete medications they prescribed
      medication = await MedicationModel.findOne({
        _id: medicationId,
        prescribedBy: req.userId
      });
    } else {
      // Patient can only delete their own medications
      medication = await MedicationModel.findOne({
        _id: medicationId,
        patientId: req.userId
      });
    }

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to delete it"
      });
    }

    await MedicationModel.findByIdAndDelete(medicationId);

    console.log("✅ Medication deleted successfully");

    res.json({
      success: true,
      message: "Medication deleted successfully"
    });

  } catch (error: any) {
    console.error('❌ Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medication",
      error: error.message
    });
  }
});

export default router;
