import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import Patient from "../models/patient"; // ✅ IMPORT PATIENT MODEL
import { connectMongoDB } from "../lib/mongodb";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

connectMongoDB();

// ✅ Helper function to get patient name
const getPatientName = (patient: any): string => {
  if (!patient) return "Patient";
  
  // Try fullName first
  if (patient.fullName && patient.fullName.trim() !== "") {
    return patient.fullName.trim();
  }
  
  // Try firstname + lastname
  if (patient.firstname && patient.lastname) {
    return `${patient.firstname.trim()} ${patient.lastname.trim()}`.trim();
  }
  
  // Try firstName + lastName (User model format)
  if (patient.firstName && patient.lastName) {
    return `${patient.firstName.trim()} ${patient.lastName.trim()}`.trim();
  }
  
  // Try just firstname
  if (patient.firstname) {
    return patient.firstname.trim();
  }
  
  // Try just firstName
  if (patient.firstName) {
    return patient.firstName.trim();
  }
  
  return "Patient";
};

router.options("*", (_req, res) => res.sendStatus(200));

router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId;
    
    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME

    const { 
      glucose, 
      systolic, 
      diastolic, 
      heartRate, 
      context, 
      lastMealTime, 
      mealType,
      exerciseRecent,
      exerciseIntensity,
      language,
      requestAI 
    } = req.body;

    // Validate required fields
    if (!glucose) {
      return res.status(400).json({ message: "Glucose value is required" });
    }
    
    if (!context) {
      return res.status(400).json({ message: "Measurement context is required" });
    }
    if (!exerciseRecent) {
      return res.status(400).json({ message: "Exercise recent information is required" });
    }
    if (!exerciseIntensity) {
      return res.status(400).json({ message: "Exercise intensity is required" });
    }

    // Validate Post-meal requirements
    if (context === "Post-meal" && (!lastMealTime || !mealType)) {
      return res.status(400).json({ 
        message: "Last meal time and meal type are required for Post-meal context" 
      });
    }

    // Validate glucose range (required)
    if (glucose < 20 || glucose > 600) {
      return res.status(400).json({ message: "Glucose must be between 20 and 600 mg/dL" });
    }

    // Validate optional fields only if they are provided
    if (systolic && (systolic < 70 || systolic > 250)) {
      return res.status(400).json({ message: "Systolic pressure must be between 70 and 250" });
    }
    if (diastolic && (diastolic < 40 || diastolic > 150)) {
      return res.status(400).json({ message: "Diastolic pressure must be between 40 and 150" });
    }
    if (heartRate && (heartRate < 40 || heartRate > 200)) {
      return res.status(400).json({ message: "Heart rate must be between 40 and 200 bpm" });
    }

    const newVitals = new Diabetes({
      userId,
      glucose: Number(glucose),
      systolic: systolic ? Number(systolic) : undefined,
      diastolic: diastolic ? Number(diastolic) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      context,
      lastMealTime: context === "Post-meal" ? lastMealTime : undefined,
      mealType: context === "Post-meal" ? mealType : undefined,
      exerciseRecent,
      exerciseIntensity,
      language: language || "en",
      aiRequested: requestAI || false,
    });

    const saved = await newVitals.save();

    console.log(`💾 New vitals saved for user ${userId}: ${saved._id}`);
    console.log(`📊 Data: Glucose=${glucose}, BP=${systolic || 'N/A'}/${diastolic || 'N/A'}, HR=${heartRate || 'N/A'}, Context=${context}`);

    res.status(201).json({
      message: "✅ Diabetes vitals saved successfully",
      id: saved._id,
      patientName, // ✅ RETURN PATIENT NAME
      data: {
        ...saved.toObject(),
        patientName, // ✅ ALSO INCLUDE IN DATA OBJECT
      },
    });

  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/diabetesVitals/me
 * Retrieve all vitals for the logged-in user
 */
router.get("/me", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME

    const vitals = await Diabetes.find({ userId }).sort({ createdAt: -1 });

    if (!vitals.length) {
      return res.status(200).json({ 
        success: true,
        message: "No vitals found for this user",
        patientName, // ✅ STILL RETURN NAME
        data: [],
        count: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: "✅ User vitals retrieved successfully",
      patientName, // ✅ RETURN PATIENT NAME
      data: vitals.map(vital => ({
        ...vital.toObject(),
        patientName, // ✅ ADD NAME TO EACH VITAL
      })),
      count: vitals.length,
    });
  } catch (error: any) {
    console.error("❌ Error retrieving vitals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/diabetesVitals/:id
 * Retrieve a specific vitals record by ID
 */
router.get("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME

    const vitals = await Diabetes.findOne({ _id: req.params.id, userId });

    if (!vitals) {
      return res.status(404).json({ 
        success: false,
        message: "Vitals not found",
        patientName, // ✅ STILL RETURN NAME
      });
    }

    res.status(200).json({
      success: true,
      message: "✅ Vitals record retrieved successfully",
      patientName, // ✅ RETURN PATIENT NAME
      data: {
        ...vitals.toObject(),
        patientName, // ✅ ADD NAME TO VITAL DATA
      },
    });
  } catch (error: any) {
    console.error("❌ Error retrieving vitals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/diabetesVitals/stats/summary
 * Get summary statistics for the logged-in user
 */
router.get("/stats/summary", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME

    const vitals = await Diabetes.find({ userId });

    if (!vitals.length) {
      return res.status(200).json({
        success: true,
        message: "No vitals found for statistics",
        patientName, // ✅ STILL RETURN NAME
        data: {
          totalReadings: 0,
          averages: {
            glucose: 0,
            systolic: 0,
            diastolic: 0,
            heartRate: 0,
          },
          readingsCount: {
            glucose: 0,
            systolic: 0,
            diastolic: 0,
            heartRate: 0,
          },
          latest: null,
          patientName, // ✅ INCLUDE IN DATA TOO
        },
      });
    }

    // Calculate averages only for fields that exist
    const glucoseReadings = vitals.filter(v => v.glucose);
    const systolicReadings = vitals.filter(v => v.systolic);
    const diastolicReadings = vitals.filter(v => v.diastolic);
    const heartRateReadings = vitals.filter(v => v.heartRate);

    const avgGlucose = glucoseReadings.length > 0 
      ? glucoseReadings.reduce((sum, v) => sum + v.glucose, 0) / glucoseReadings.length 
      : 0;

    const avgSystolic = systolicReadings.length > 0
      ? systolicReadings.reduce((sum, v) => sum + (v.systolic || 0), 0) / systolicReadings.length
      : 0;

    const avgDiastolic = diastolicReadings.length > 0
      ? diastolicReadings.reduce((sum, v) => sum + (v.diastolic || 0), 0) / diastolicReadings.length
      : 0;

    const avgHeartRate = heartRateReadings.length > 0
      ? heartRateReadings.reduce((sum, v) => sum + (v.heartRate || 0), 0) / heartRateReadings.length
      : 0;

    // Get latest reading
    const latest = vitals[0];

    res.status(200).json({
      success: true,
      message: "✅ Statistics retrieved successfully",
      patientName, // ✅ RETURN PATIENT NAME
      data: {
        totalReadings: vitals.length,
        averages: {
          glucose: Math.round(avgGlucose * 10) / 10,
          systolic: Math.round(avgSystolic * 10) / 10,
          diastolic: Math.round(avgDiastolic * 10) / 10,
          heartRate: Math.round(avgHeartRate * 10) / 10,
        },
        readingsCount: {
          glucose: glucoseReadings.length,
          systolic: systolicReadings.length,
          diastolic: diastolicReadings.length,
          heartRate: heartRateReadings.length,
        },
        latest: {
          ...latest.toObject(),
          patientName, // ✅ ADD NAME TO LATEST
        },
        patientName, // ✅ ALSO INCLUDE AT DATA LEVEL
      },
    });
  } catch (error: any) {
    console.error("❌ Error retrieving statistics:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

/**
 * ✅ GET /api/diabetesVitals/glucose/latest
 * Get the latest glucose reading for the logged-in user
 */
router.get("/glucose/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME

    const latestVital = await Diabetes.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('glucose context systolic diastolic heartRate exerciseRecent exerciseIntensity lastMealTime mealType language createdAt');

    if (!latestVital) {
      return res.status(200).json({ 
        success: true,
        message: "No glucose readings found",
        patientName, // ✅ STILL RETURN NAME
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      patientName, // ✅ RETURN PATIENT NAME
      data: {
        ...latestVital.toObject(),
        patientName, // ✅ ADD NAME TO DATA
      }
    });
  } catch (error: any) {
    console.error("❌ Error retrieving latest glucose:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

export default router;