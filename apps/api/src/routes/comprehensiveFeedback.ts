// routes/comprehensiveFeedback.ts
import express, { Request, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import Patient from "../models/patient";
import Diabetes from "../models/diabetesModel";
import Lifestyle from "../models/lifestyleModel";
import { SmartCareAI, FoodAdviceInput, ComprehensiveFeedbackInput } from "../services/SmartCareAI";

const router = express.Router();
const aiService = new SmartCareAI();

const calculateAge = (dob: Date | string | undefined): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age : 0;
};

// ✅ GET comprehensive AI feedback combining summary, food, lifestyle, and encouragement
router.get("/comprehensive-feedback/:vitalId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const vitalId = req.params.vitalId;
    
    // Validate vitalId
    if (!vitalId || vitalId === 'undefined' || vitalId === 'null') {
      return res.status(400).json({ 
        success: false,
        message: "Valid vital ID is required" 
      });
    }

    console.log("🎯 Generating comprehensive feedback for vital:", vitalId);

    // Fetch all necessary data
    const [patient, vital, latestLifestyle] = await Promise.all([
      Patient.findOne({ userId }),
      Diabetes.findOne({ _id: vitalId, userId }),
      Lifestyle.findOne({ userId }).sort({ createdAt: -1 })
    ]);

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    if (!vital) {
      return res.status(404).json({ 
        success: false,
        message: "Vital record not found" 
      });
    }
    
    const age = calculateAge(patient.dob);

    // Prepare data for AI
    const foodInput: FoodAdviceInput = {
      glucose: vital.glucose,
      context: (vital.context as "Fasting" | "Post-meal" | "Random") || "Random",
      systolic: vital.systolic,
      diastolic: vital.diastolic,
      heartRate: vital.heartRate,
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      language: (patient.language as "en" | "sw") || "en",
      exerciseRecent: vital.exerciseRecent,
      exerciseIntensity: vital.exerciseIntensity,
      lastMealTime: vital.lastMealTime,
      mealType: vital.mealType,
      lifestyle: patient.lifestyle ? {
        alcohol: patient.lifestyle.alcohol || "Unknown",
        smoking: patient.lifestyle.smoking || "Unknown",
        exercise: patient.lifestyle.exercise || "Unknown",
        sleep: patient.lifestyle.sleep || "Unknown",
      } : undefined,
      allergies: Array.isArray(patient.allergies)
        ? patient.allergies
        : patient.allergies
        ? [String(patient.allergies)]
        : [],
      medicalHistory: Array.isArray(patient.medicalHistory)
        ? patient.medicalHistory
        : patient.medicalHistory
        ? [String(patient.medicalHistory)]
        : [],
    };

    console.log("🔄 Generating comprehensive AI feedback...");

    // Generate all AI components in parallel for better performance
    const [summary, foodAdvice, quickTips] = await Promise.all([
      aiService.generateSummary(foodInput),
      aiService.generateKenyanFoodAdvice(foodInput),
      aiService.generateQuickFoodTips(foodInput)
    ]);

    // Generate lifestyle feedback if available
    let lifestyleFeedback = "";
    if (latestLifestyle) {
      const lifestyleInput = {
        ...foodInput,
        lifestyle: {
          alcohol: latestLifestyle.alcohol,
          smoking: latestLifestyle.smoking,
          exercise: latestLifestyle.exercise,
          sleep: latestLifestyle.sleep,
        }
      };
      lifestyleFeedback = await aiService.generateLifestyleFeedback(lifestyleInput);
    }

    // Generate comprehensive final feedback
    const comprehensiveInput: ComprehensiveFeedbackInput = {
      summary,
      foodAdvice,
      quickTips,
      lifestyleFeedback,
      vitalData: vital,
      patientData: patient,
      hasBloodPressure: !!(vital.systolic && vital.diastolic),
      hasHeartRate: !!vital.heartRate,
      language: (patient.language as "en" | "sw") || "en"
    };

    const finalFeedback = await aiService.generateComprehensiveFeedback(comprehensiveInput);

    res.status(200).json({
      success: true,
      data: {
        comprehensiveFeedback: finalFeedback,
        components: {
          summary,
          foodAdvice,
          quickTips,
          lifestyleFeedback: latestLifestyle ? lifestyleFeedback : "No lifestyle data available"
        },
        context: {
          glucose: vital.glucose,
          context: vital.context,
          bloodPressure: vital.systolic && vital.diastolic ? 
            `${vital.systolic}/${vital.diastolic}` : 'Not recorded',
          heartRate: vital.heartRate || 'Not recorded',
          exercise: vital.exerciseRecent && vital.exerciseIntensity ?
            `${vital.exerciseRecent} (${vital.exerciseIntensity})` : 'Not recorded',
          lifestyleRecorded: !!latestLifestyle
        },
        recommendations: {
          recordBloodPressure: !vital.systolic || !vital.diastolic,
          recordHeartRate: !vital.heartRate,
          completeLifestyle: !latestLifestyle
        }
      },
    });
  } catch (error: any) {
    console.error("❌ Error generating comprehensive feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating comprehensive feedback",
      error: error.message,
    });
  }
});

// ✅ NEW: Get comprehensive feedback using latest glucose reading
router.get("/latest-comprehensive-feedback", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get latest glucose reading
    const latestVital = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!latestVital) {
      return res.status(404).json({
        success: false,
        message: "No glucose readings found. Please add a reading first."
      });
    }

    // Redirect to the comprehensive feedback endpoint with the latest vital ID
    res.redirect(`/api/comprehensive-feedback/${latestVital._id}`);
  } catch (error: any) {
    console.error("❌ Error getting latest comprehensive feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;