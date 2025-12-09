// apps/api/src/routes/relativePatient.ts
// NEW FILE - Create this to handle relative's access to patient data

import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Patient from "../models/patient";
import User from "../models/user";
import HypertensionVital from "../models/hypertensionVitals";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Authentication middleware for relatives
const authenticateRelative = (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    );

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    console.log("✅ Authenticated relative:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ 
      success: false,
      message: "Invalid token" 
    });
  }
};

// Helper function to convert userId to ObjectId
const toObjectId = (userId: any) => {
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }
  } catch (e) {
    console.error("ObjectId conversion failed:", e);
  }
  return userId;
};

// ✅ GET /api/relative/patient-profile
// Get the monitored patient's profile
router.get("/patient-profile", authenticateRelative, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    console.log("🔍 Relative fetching patient profile, relativeId:", req.userId);

    // Get the relative's user record
    const relativeUser = await User.findById(toObjectId(req.userId));
    
    if (!relativeUser || relativeUser.role !== "relative") {
      console.error("❌ Not a relative user");
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a relative account."
      });
    }

    console.log("✅ Relative user found:", {
      id: relativeUser._id,
      email: relativeUser.email,
      monitoredPatient: relativeUser.monitoredPatient,
      monitoredPatientProfile: relativeUser.monitoredPatientProfile
    });

    // Get the patient profile
    if (!relativeUser.monitoredPatientProfile) {
      return res.status(404).json({
        success: false,
        message: "No patient profile linked to this relative account"
      });
    }

    const patient = await Patient.findById(relativeUser.monitoredPatientProfile);

    if (!patient) {
      console.error("❌ Patient profile not found");
      return res.status(404).json({
        success: false,
        message: "Patient profile not found"
      });
    }

    console.log("✅ Patient profile found:", patient._id);

    // Get patient's user account for additional info
    const patientUser = await User.findById(toObjectId(patient.userId));

    res.status(200).json({
      success: true,
      data: {
        id: patient._id.toString(),
        name: patient.fullName || `${patient.firstname} ${patient.lastname}`,
        email: patientUser?.email || patient.email,
        phoneNumber: patient.phoneNumber || patientUser?.phoneNumber,
        condition: patient.condition || 
                   (patient.diabetes && patient.hypertension ? 'both' : 
                    patient.diabetes ? 'diabetes' : 
                    patient.hypertension ? 'hypertension' : 'unknown'),
        dob: patient.dob,
        gender: patient.gender,
        diabetes: patient.diabetes || false,
        hypertension: patient.hypertension || false,
        cardiovascular: patient.cardiovascular || false,
        allergies: patient.allergies || "",
        surgeries: patient.surgeries || "",
        picture: patient.picture,
        weight: patient.weight,
        height: patient.height
      }
    });

  } catch (error) {
    console.error("❌ Fetch patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile"
    });
  }
});

// ✅ GET /api/relative/patient-vitals
// Get the monitored patient's vital signs
router.get("/patient-vitals", authenticateRelative, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    console.log("🔍 Relative fetching patient vitals, relativeId:", req.userId);

    // Get the relative's user record
    const relativeUser = await User.findById(toObjectId(req.userId));
    
    if (!relativeUser || relativeUser.role !== "relative") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (!relativeUser.monitoredPatient) {
      return res.status(404).json({
        success: false,
        message: "No patient linked"
      });
    }

    const patientUserId = relativeUser.monitoredPatient;
    console.log("📋 Fetching vitals for patient userId:", patientUserId);

    // Get patient profile to determine condition
    const patient = await Patient.findById(relativeUser.monitoredPatientProfile);

    let vitals: any[] = [];

    // Fetch vitals from both collections
    const [hypertensionVitals, diabetesVitals] = await Promise.all([
      HypertensionVital.find({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ]
      }).sort({ createdAt: -1 }).limit(100),
      
      Diabetes.find({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ]
      }).sort({ createdAt: -1 }).limit(100)
    ]);

    console.log(`💙 Found ${hypertensionVitals.length} hypertension vitals`);
    console.log(`💛 Found ${diabetesVitals.length} diabetes vitals`);

    // Combine and format vitals
    vitals = [
      ...hypertensionVitals.map(vital => ({
        id: vital._id.toString(),
        type: 'hypertension',
        source: 'hypertension',
        timestamp: vital.createdAt.toISOString(),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        heartRate: vital.heartRate,
        glucose: undefined
      })),
      ...diabetesVitals.map(vital => ({
        id: vital._id.toString(),
        type: 'diabetes',
        source: 'diabetes',
        timestamp: vital.createdAt.toISOString(),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        heartRate: vital.heartRate,
        glucose: vital.glucose,
        context: vital.context,
        exerciseRecent: vital.exerciseRecent,
        exerciseIntensity: vital.exerciseIntensity
      }))
    ];

    // Sort by timestamp (newest first)
    vitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`✅ Returning ${vitals.length} total vitals`);

    res.status(200).json({
      success: true,
      data: vitals,
      count: vitals.length,
      patientCondition: patient?.condition || 'unknown',
      patientName: patient?.fullName
    });

  } catch (error) {
    console.error("❌ Fetch patient vitals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient vitals"
    });
  }
});

// ✅ GET /api/relative/patient-summary
// Get summary of patient's latest vitals
router.get("/patient-summary", authenticateRelative, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const relativeUser = await User.findById(toObjectId(req.userId));
    
    if (!relativeUser || relativeUser.role !== "relative" || !relativeUser.monitoredPatient) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const patientUserId = relativeUser.monitoredPatient;

    // Get latest vitals from both collections
    const [latestHypertension, latestDiabetes] = await Promise.all([
      HypertensionVital.findOne({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ]
      }).sort({ createdAt: -1 }),
      
      Diabetes.findOne({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ]
      }).sort({ createdAt: -1 })
    ]);

    // Use the most recent vital
    let latestVital = null;
    if (latestHypertension && latestDiabetes) {
      latestVital = latestHypertension.createdAt > latestDiabetes.createdAt 
        ? latestHypertension 
        : latestDiabetes;
    } else {
      latestVital = latestHypertension || latestDiabetes;
    }

    const patient = await Patient.findById(relativeUser.monitoredPatientProfile);

    const summary = latestVital ? {
      condition: patient?.condition || 'unknown',
      hasData: true,
      timestamp: latestVital.createdAt,
      ...(latestVital.systolic !== undefined ? { systolic: latestVital.systolic } : {}),
      ...(latestVital.diastolic !== undefined ? { diastolic: latestVital.diastolic } : {}),
      ...(latestVital.heartRate !== undefined ? { heartRate: latestVital.heartRate } : {}),
      ...(latestVital.glucose !== undefined ? { glucose: latestVital.glucose } : {})
    } : {
      condition: patient?.condition || 'unknown',
      hasData: false
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error("❌ Fetch patient summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient summary"
    });
  }
});

// ✅ GET /api/relative/patient-stats
// Get statistics for patient's vitals
router.get("/patient-stats", authenticateRelative, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { days = '30' } = req.query;
    const relativeUser = await User.findById(toObjectId(req.userId));
    
    if (!relativeUser || relativeUser.role !== "relative" || !relativeUser.monitoredPatient) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const patientUserId = relativeUser.monitoredPatient;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get vitals from last X days
    const [hypertensionVitals, diabetesVitals] = await Promise.all([
      HypertensionVital.find({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ],
        createdAt: { $gte: daysAgo }
      }),
      Diabetes.find({
        $or: [
          { userId: patientUserId },
          { userId: toObjectId(patientUserId) }
        ],
        createdAt: { $gte: daysAgo }
      })
    ]);

    const allVitals = [...hypertensionVitals, ...diabetesVitals];
    const patient = await Patient.findById(relativeUser.monitoredPatientProfile);

    const stats = {
      condition: patient?.condition || 'unknown',
      count: allVitals.length,
      avgSystolic: allVitals.length > 0 ? 
        Math.round(allVitals.reduce((sum, v) => sum + (v.systolic || 0), 0) / allVitals.length) : 0,
      avgDiastolic: allVitals.length > 0 ? 
        Math.round(allVitals.reduce((sum, v) => sum + (v.diastolic || 0), 0) / allVitals.length) : 0,
      avgHeartRate: allVitals.length > 0 ? 
        Math.round(allVitals.reduce((sum, v) => sum + (v.heartRate || 0), 0) / allVitals.length) : 0,
      avgGlucose: allVitals.length > 0 && diabetesVitals.length > 0 ? 
        Math.round(diabetesVitals.reduce((sum, v) => sum + (v.glucose || 0), 0) / diabetesVitals.length) : 0,
      period: `${days} days`
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ Fetch patient stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient statistics"
    });
  }
});

export default router;