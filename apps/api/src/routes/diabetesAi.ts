import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import Patient from "../models/patient";
import { SmartCareAI } from "../services/SmartCareAI";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// ✅ Create ONE shared instance instead of per-request
let smartCareAI: SmartCareAI | null = null;

const getAIService = () => {
  if (!smartCareAI) {
    console.log("🤖 Initializing SmartCareAI service...");
    smartCareAI = new SmartCareAI();
  }
  return smartCareAI;
};

router.options("*", (_req, res) => res.sendStatus(200));

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

const calculateAge = (dob: Date | string | undefined): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
};

// ✅ Helper function to check if summary is valid
const isValidSummary = (summary: string | undefined): boolean => {
  if (!summary || summary.trim() === "") return false;
  
  // Check for error messages
  const errorIndicators = ["❌", "⚠️", "Error:", "unavailable", "failed"];
  return !errorIndicators.some(indicator => 
    summary.includes(indicator)
  );
};

// ✅ MAIN ENDPOINT: GET /api/diabetesAi/summary/:id
router.get("/summary/:id", verifyToken, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      console.error("❌ Unauthorized: No userId in token");
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const vitalId = req.params.id;
    console.log("=".repeat(60));
    console.log(`🔍 [${new Date().toISOString()}] Summary request for vital: ${vitalId}`);
    console.log(`👤 User: ${userId}`);

    // ✅ 1. Fetch vitals
    const vitals = await Diabetes.findById(vitalId);
    
    if (!vitals) {
      console.error(`❌ Vitals not found: ${vitalId}`);
      return res.status(404).json({ 
        success: false,
        message: "Vitals not found" 
      });
    }

    console.log(`📊 Vitals found - Glucose: ${vitals.glucose} mg/dL (${vitals.context})`);
    console.log(`💓 Additional data - BP: ${vitals.systolic || 'N/A'}/${vitals.diastolic || 'N/A'}, HR: ${vitals.heartRate || 'N/A'}`);
    console.log(`🏃 Exercise: ${vitals.exerciseRecent || 'N/A'} (${vitals.exerciseIntensity || 'N/A'})`);

    // ✅ 2. Check if we have a VALID cached summary
    if (isValidSummary(vitals.summary)) {
      const age = Date.now() - new Date(vitals.updatedAt).getTime();
      const ageMinutes = Math.floor(age / 60000);
      
      console.log(`✅ Valid cached summary found (${ageMinutes} minutes old)`);
      console.log(`📝 Summary: ${vitals.summary?.substring(0, 100)}...`);
      console.log(`⏱️  Response time: ${Date.now() - startTime}ms`);
      console.log("=".repeat(60));
      
      return res.status(200).json({ 
        success: true,
        aiFeedback: vitals.summary, 
        cached: true,
        cacheAge: ageMinutes
      });
    }

    console.log("🔄 No valid cached summary - generating new one");

    // ✅ 3. Fetch patient profile
    console.log(`🔍 Fetching patient profile for userId: ${userId}`);
    const patient = await Patient.findOne({ userId });
    
    if (!patient) {
      console.error(`❌ Patient profile not found for userId: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: "Patient profile not found. Please complete your profile first." 
      });
    }

    const age = calculateAge(patient.dob);
    console.log(`👤 Patient found - Age: ${age}, Gender: ${patient.gender}`);

    // ✅ 4. Prepare COMPLETE glucose data with all available context
    const glucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: (patient.language as "en" | "sw") || "en",
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      // ✅ ADDITIONAL CONTEXT: Blood pressure, heart rate, exercise data
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      heartRate: vitals.heartRate,
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
    };

    console.log("📋 Complete glucose data prepared:", {
      glucose: glucoseData.glucose,
      context: glucoseData.context,
      bp: `${glucoseData.systolic || 'N/A'}/${glucoseData.diastolic || 'N/A'}`,
      hr: glucoseData.heartRate || 'N/A',
      exercise: `${glucoseData.exerciseRecent || 'N/A'} (${glucoseData.exerciseIntensity || 'N/A'})`,
      meal: glucoseData.lastMealTime ? `${glucoseData.mealType} (${glucoseData.lastMealTime} ago)` : 'N/A'
    });

    // ✅ 5. Check if GROQ_API_KEY exists
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY not found in environment");
      console.error("Available env vars:", Object.keys(process.env).filter(k => 
        !k.includes("SECRET") && !k.includes("PASSWORD")
      ));
      
      return res.status(503).json({
        success: false,
        message: "AI service not configured. Please contact support.",
        error: "GROQ_API_KEY missing"
      });
    }

    console.log("✅ GROQ_API_KEY is configured");

    // ✅ 6. Generate AI summary with ALL context
    console.log("🤖 Calling SmartCareAI.generateSummary() with complete context...");
    const aiStartTime = Date.now();
    
    const ai = getAIService();
    const aiFeedback = await ai.generateSummary(glucoseData);
    
    const aiDuration = Date.now() - aiStartTime;
    console.log(`🤖 AI responded in ${aiDuration}ms`);
    console.log(`📝 Generated feedback: ${aiFeedback?.substring(0, 150)}...`);

    // ✅ 7. Check if AI generation failed
    if (!isValidSummary(aiFeedback)) {
      console.error("❌ AI generated invalid summary:", aiFeedback);
      
      return res.status(500).json({
        success: false,
        message: "Failed to generate AI summary",
        error: aiFeedback,
        details: {
          groqConfigured: !!process.env.GROQ_API_KEY,
          vitalId,
          glucoseData: {
            glucose: glucoseData.glucose,
            context: glucoseData.context,
            hasBP: !!(glucoseData.systolic && glucoseData.diastolic),
            hasHR: !!glucoseData.heartRate,
            hasExercise: !!(glucoseData.exerciseRecent && glucoseData.exerciseIntensity)
          }
        }
      });
    }

    // ✅ 8. Save to database
    console.log("💾 Saving summary to database...");
    vitals.summary = aiFeedback;
    vitals.aiFeedback = aiFeedback;
    await vitals.save();
    console.log("✅ Summary saved successfully");

    const totalDuration = Date.now() - startTime;
    console.log(`⏱️  Total request time: ${totalDuration}ms`);
    console.log("=".repeat(60));

    // ✅ 9. Return success response
    res.status(200).json({ 
      success: true,
      aiFeedback, 
      cached: false,
      generationTime: aiDuration,
      totalTime: totalDuration,
      contextUsed: {
        glucose: glucoseData.glucose,
        context: glucoseData.context,
        bloodPressure: glucoseData.systolic && glucoseData.diastolic ? 
          `${glucoseData.systolic}/${glucoseData.diastolic}` : 'Not provided',
        heartRate: glucoseData.heartRate || 'Not provided',
        exercise: glucoseData.exerciseRecent && glucoseData.exerciseIntensity ? 
          `${glucoseData.exerciseRecent} (${glucoseData.exerciseIntensity})` : 'Not provided',
        mealTiming: glucoseData.lastMealTime ? `${glucoseData.mealType} (${glucoseData.lastMealTime} ago)` : 'Not provided'
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("=".repeat(60));
    console.error("❌ SUMMARY GENERATION ERROR:");
    console.error("- Message:", error.message);
    console.error("- Stack:", error.stack);
    console.error("- Duration:", duration, "ms");
    console.error("=".repeat(60));
    
    res.status(500).json({ 
      success: false,
      message: "Failed to generate summary", 
      error: error.message,
      details: {
        duration,
        timestamp: new Date().toISOString(),
        groqConfigured: !!process.env.GROQ_API_KEY
      }
    });
  }
});

// ✅ Food Advice Endpoint - Updated to use all context
router.get("/food-advice/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const vitalId = req.params.id;
    console.log(`🍽️ Food advice request for vital: ${vitalId}`);

    // Fetch vitals and patient data
    const vitals = await Diabetes.findById(vitalId);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const age = calculateAge(patient.dob);

    // Prepare complete data for food advice
    const foodAdviceData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      heartRate: vitals.heartRate,
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      language: (patient.language as "en" | "sw") || "en",
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
    };

    console.log("🍽️ Food advice data:", {
      glucose: foodAdviceData.glucose,
      context: foodAdviceData.context,
      bp: `${foodAdviceData.systolic || 'N/A'}/${foodAdviceData.diastolic || 'N/A'}`,
      exercise: `${foodAdviceData.exerciseRecent || 'N/A'} (${foodAdviceData.exerciseIntensity || 'N/A'})`
    });

    const ai = getAIService();
    const foodAdvice = await ai.generateKenyanFoodAdvice(foodAdviceData);

    res.status(200).json({
      success: true,
      foodAdvice,
      contextUsed: {
        glucose: foodAdviceData.glucose,
        context: foodAdviceData.context,
        bloodPressure: foodAdviceData.systolic && foodAdviceData.diastolic ? 
          `${foodAdviceData.systolic}/${foodAdviceData.diastolic}` : 'Not provided',
        exercise: foodAdviceData.exerciseRecent && foodAdviceData.exerciseIntensity ? 
          `${foodAdviceData.exerciseRecent} (${foodAdviceData.exerciseIntensity})` : 'Not provided'
      }
    });

  } catch (error: any) {
    console.error("❌ Food advice error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate food advice", 
      error: error.message 
    });
  }
});

// ✅ Separate endpoint to check if summary is ready
router.get("/summary-status/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const vitals = await Diabetes.findById(req.params.id);
    
    if (!vitals) {
      return res.status(404).json({ 
        success: false, 
        message: "Vitals not found" 
      });
    }

    const hasSummary = isValidSummary(vitals.summary);

    res.status(200).json({
      success: true,
      isGenerating: !hasSummary,
      aiFeedback: hasSummary ? vitals.summary : null,
      lastUpdated: vitals.updatedAt,
    });
  } catch (error: any) {
    console.error("❌ Summary status check error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// ✅ Force regenerate summary (bypass cache)
router.post("/summary/:id/regenerate", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const vitals = await Diabetes.findById(req.params.id);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals not found" });
    }

    // Clear existing summary to force regeneration
    vitals.summary = "";
    await vitals.save();

    console.log("🔄 Summary cleared, triggering regeneration");

    res.status(200).json({
      success: true,
      message: "Summary regeneration triggered. Fetch summary again to get new result."
    });

  } catch (error: any) {
    console.error("❌ Regenerate error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to regenerate summary", 
      error: error.message 
    });
  }
});

export default router;