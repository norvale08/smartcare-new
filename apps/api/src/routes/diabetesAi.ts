import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import Patient from "../models/patient";
import { SmartCareAI } from "../services/SmartCareAI";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

let smartCareAI: SmartCareAI | null = null;

const getAIService = () => {
  if (!smartCareAI) {
   
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

const isValidSummary = (summary: string | undefined): boolean => {
  if (!summary || summary.trim() === "") return false;
  
  const errorIndicators = ["❌", "⚠️", "Error:", "unavailable", "failed"];
  return !errorIndicators.some(indicator => 
    summary.includes(indicator)
  );
};

// ✅ HELPER FUNCTION TO GET PATIENT NAME
const getPatientName = (patient: any): string => {
  if (!patient) return "Patient";
  
  if (patient.fullName && patient.fullName.trim() !== "") {
    return patient.fullName.trim();
  }
  
  if (patient.firstname && patient.lastname) {
    return `${patient.firstname.trim()} ${patient.lastname.trim()}`.trim();
  }
  
  if (patient.firstName && patient.lastName) {
    return `${patient.firstName.trim()} ${patient.lastName.trim()}`.trim();
  }
  
  if (patient.firstname) {
    return patient.firstname.trim();
  }
  
  if (patient.firstName) {
    return patient.firstName.trim();
  }
  
  return "Patient";
};

//  HELPER FUNCTION TO GET SELECTED DISEASES FROM PATIENT PROFILE
const getPatientDiseases = (patient: any): ("diabetes" | "hypertension")[] => {
  const diseases: ("diabetes" | "hypertension")[] = [];
  
  if (!patient) {
    return ["diabetes"]; // Default
  }
  
  // Check diabetes flag
  if (patient.diabetes === true) {
    diseases.push("diabetes");
  }
  
  // Check hypertension flag
  if (patient.hypertension === true) {
    diseases.push("hypertension");
  }
  
  // If no diseases found, default to diabetes
  if (diseases.length === 0) {
    diseases.push("diabetes");
  }
  
  return diseases;
};

//  MAIN ENDPOINT: GET /api/diabetesAi/summary/:id
router.get("/summary/:id", verifyToken, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      console.error(" Unauthorized: No userId in token");
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const vitalId = req.params.id;
    //  Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    
    
    //  1. Fetch vitals
    const vitals = await Diabetes.findById(vitalId);
    
    if (!vitals) {
      console.error(` Vitals not found: ${vitalId}`);
      return res.status(404).json({ 
        success: false,
        message: "Vitals not found" 
      });
    }

    //  USE QUERY PARAM LANGUAGE, FALLBACK TO DB, THEN DEFAULT TO 'en'
    const language = (requestedLanguage || vitals.language || "en") as "en" | "sw";
    
  
    //  2. Check if we have a VALID cached summary IN THE RIGHT LANGUAGE
    const hasCachedSummary = isValidSummary(vitals.aiFeedback);
    const isSameLanguage = vitals.language === language;
    
    if (hasCachedSummary && isSameLanguage) {
      const age = Date.now() - new Date(vitals.updatedAt).getTime();
      const ageMinutes = Math.floor(age / 60000);
      
      
      
      return res.status(200).json({ 
        success: true,
        aiFeedback: vitals.aiFeedback, 
        cached: true,
        cacheAge: ageMinutes,
        language: language,
        selectedDiseases: vitals.selectedDiseases || ["diabetes"]
      });
    }


    //  3. Fetch patient profile
  
    const patient = await Patient.findOne({ userId });
    
    if (!patient) {
      console.error(` Patient profile not found for userId: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: "Patient profile not found. Please complete your profile first." 
      });
    }

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    //  4. GET SELECTED DISEASES FROM PATIENT PROFILE
    const selectedDiseases = vitals.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");
    
    
  
    // 5. Prepare COMPLETE glucose data with patient name AND diseases
    const glucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: language, //  Use prioritized language
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      heartRate: vitals.heartRate,
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
      patientName: patientName,
      selectedDiseases: selectedDiseases,
    };

    

    //  6. Check if GROQ_API_KEY exists
    if (!process.env.GROQ_API_KEY) {
      console.error(" GROQ_API_KEY not found in environment");
      return res.status(503).json({
        success: false,
        message: "AI service not configured. Please contact support.",
        error: "GROQ_API_KEY missing"
      });
    }

   

    //  7. Generate AI summary with patient name AND diseases
    
    const aiStartTime = Date.now();
    
    const ai = getAIService();
    const aiFeedback = await ai.generateSummary(glucoseData);
    
    const aiDuration = Date.now() - aiStartTime;
    
    // ✅ 8. Check if AI generation failed
    if (!isValidSummary(aiFeedback)) {
      console.error(" AI generated invalid summary:", aiFeedback);
      
      return res.status(500).json({
        success: false,
        message: "Failed to generate AI summary",
        error: aiFeedback,
        details: {
          groqConfigured: !!process.env.GROQ_API_KEY,
          vitalId,
          patientName,
          language: glucoseData.language,
          selectedDiseases,
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

    //  9. Save to database WITH THE NEW LANGUAGE
   
    vitals.aiFeedback = aiFeedback;
    vitals.language = language; //  Update language in DB
    await vitals.save();
   

    const totalDuration = Date.now() - startTime;
    

    //  10. Return success response
    res.status(200).json({ 
      success: true,
      aiFeedback, 
      cached: false,
      patientName,
      selectedDiseases,
      diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
      conditions: {
        diabetes: selectedDiseases.includes("diabetes"),
        hypertension: selectedDiseases.includes("hypertension"),
      },
      language: glucoseData.language,
      generationTime: aiDuration,
      totalTime: totalDuration,
      contextUsed: {
        glucose: glucoseData.glucose,
        context: glucoseData.context,
        language: glucoseData.language,
        patientName: patientName,
        selectedDiseases,
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
    console.error(" SUMMARY GENERATION ERROR:");
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

//  Food Advice Endpoint - Updated to include patient name, diseases, and language from query
router.get("/food-advice/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const vitalId = req.params.id;
    //  Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    
   

    const vitals = await Diabetes.findById(vitalId);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    //  USE QUERY PARAM LANGUAGE, FALLBACK TO DB, THEN DEFAULT TO 'en'
    const language = (requestedLanguage || vitals.language || "en") as "en" | "sw";

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    //  GET SELECTED DISEASES
    const selectedDiseases = vitals.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

    

    //  Prepare food advice data with patient name, diseases, and prioritized language
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
      language: language, //  Use prioritized language
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
      patientName: patientName,
      selectedDiseases: selectedDiseases,
      allergies: patient.allergies ? [patient.allergies] : [],
      medicalHistory: patient.selectedDiseases || [],
    };

    

    const ai = getAIService();
    const foodAdvice = await ai.generateKenyanFoodAdvice(foodAdviceData);

    res.status(200).json({
      success: true,
      foodAdvice,
      patientName,
      selectedDiseases,
      diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
      conditions: {
        diabetes: selectedDiseases.includes("diabetes"),
        hypertension: selectedDiseases.includes("hypertension"),
      },
      language: foodAdviceData.language,
      contextUsed: {
        glucose: foodAdviceData.glucose,
        context: foodAdviceData.context,
        language: foodAdviceData.language,
        patientName: patientName,
        selectedDiseases,
        bloodPressure: foodAdviceData.systolic && foodAdviceData.diastolic ? 
          `${foodAdviceData.systolic}/${foodAdviceData.diastolic}` : 'Not provided',
        exercise: foodAdviceData.exerciseRecent && foodAdviceData.exerciseIntensity ? 
          `${foodAdviceData.exerciseRecent} (${foodAdviceData.exerciseIntensity})` : 'Not provided',
        allergies: foodAdviceData.allergies || [],
        medicalHistory: foodAdviceData.medicalHistory || []
      }
    });

  } catch (error: any) {
    console.error(" Food advice error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate food advice", 
      error: error.message 
    });
  }
});

//  Quick Tips Endpoint - Updated to include patient name, diseases, and language from query
router.get("/quick-tips/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const vitalId = req.params.id;
    //  Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    


    const vitals = await Diabetes.findById(vitalId);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    //  USE QUERY PARAM LANGUAGE, FALLBACK TO DB, THEN DEFAULT TO 'en'
    const language = (requestedLanguage || vitals.language || "en") as "en" | "sw";

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    //  GET SELECTED DISEASES
    const selectedDiseases = vitals.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

    const quickTipsData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      heartRate: vitals.heartRate,
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      language: language, //  Use prioritized language
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
      patientName: patientName,
      selectedDiseases: selectedDiseases,
    };

    

    const ai = getAIService();
    const quickTips = await ai.generateQuickTips(quickTipsData);

    res.status(200).json({
      success: true,
      quickTips,
      patientName,
      selectedDiseases,
      diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
      conditions: {
        diabetes: selectedDiseases.includes("diabetes"),
        hypertension: selectedDiseases.includes("hypertension"),
      },
      language: quickTipsData.language,
    });

  } catch (error: any) {
    console.error(" Quick tips error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate quick tips", 
      error: error.message 
    });
  }
});

//  Comprehensive Feedback Endpoint - Updated with diseases and language from query
router.get("/comprehensive-feedback/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const vitalId = req.params.id;
    // Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    
   
    const vitals = await Diabetes.findById(vitalId);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    //  USE QUERY PARAM LANGUAGE, FALLBACK TO DB, THEN DEFAULT TO 'en'
    const language = (requestedLanguage || vitals.language || "en") as "en" | "sw";

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    //  GET SELECTED DISEASES
    const selectedDiseases = vitals.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

    const glucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      heartRate: vitals.heartRate,
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      language: language, //  Use prioritized language
      exerciseRecent: vitals.exerciseRecent,
      exerciseIntensity: vitals.exerciseIntensity,
      lastMealTime: vitals.lastMealTime,
      mealType: vitals.mealType,
      patientName: patientName,
      selectedDiseases: selectedDiseases,
    };

    
    const ai = getAIService();

    // Generate all components
    const [summary, foodAdvice, quickTips, glucoseFeedback] = await Promise.all([
      ai.generateSummary(glucoseData),
      ai.generateKenyanFoodAdvice({
        ...glucoseData,
        allergies: patient.allergies ? [patient.allergies] : [],
        medicalHistory: patient.selectedDiseases || [],
      }),
      ai.generateQuickTips(glucoseData),
      ai.generateGlucoseFeedback(glucoseData),
    ]);

    // Prepare comprehensive feedback input
    const comprehensiveData = {
      summary,
      foodAdvice,
      quickTips,
      lifestyleFeedback: glucoseFeedback,
      vitalData: glucoseData,
      patientData: {
        name: patientName,
        age,
        gender: patient.gender,
        weight: patient.weight,
        height: patient.height,
      },
      hasBloodPressure: !!(vitals.systolic && vitals.diastolic),
      hasHeartRate: !!vitals.heartRate,
      language: language, //  Use prioritized language
      patientName: patientName,
      selectedDiseases: selectedDiseases,
    };

    const comprehensiveFeedback = await ai.generateComprehensiveFeedback(comprehensiveData);

    res.status(200).json({
      success: true,
      comprehensiveFeedback,
      patientName,
      selectedDiseases,
      diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
      conditions: {
        diabetes: selectedDiseases.includes("diabetes"),
        hypertension: selectedDiseases.includes("hypertension"),
      },
      language: glucoseData.language,
      components: {
        summary,
        foodAdvice,
        quickTips,
        glucoseFeedback,
      },
    });

  } catch (error: any) {
    console.error("Comprehensive feedback error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate comprehensive feedback", 
      error: error.message 
    });
  }
});

router.get("/summary-status/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const vitals = await Diabetes.findById(req.params.id);
    
    if (!vitals) {
      return res.status(404).json({ 
        success: false, 
        message: "Vitals not found" 
      });
    }

    const hasSummary = isValidSummary(vitals.aiFeedback);

    res.status(200).json({
      success: true,
      isGenerating: !hasSummary,
      aiFeedback: hasSummary ? vitals.aiFeedback : null,
      language: vitals.language,
      selectedDiseases: vitals.selectedDiseases || ["diabetes"],
      lastUpdated: vitals.updatedAt,
    });
  } catch (error: any) {
    console.error(" Summary status check error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

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

    vitals.aiFeedback = "";
    await vitals.save();

    

    res.status(200).json({
      success: true,
      message: "Summary regeneration triggered. Fetch summary again to get new result."
    });

  } catch (error: any) {
    console.error(" Regenerate Error:", error.message);
res.status(500).json({
success: false,
message: "Failed to regenerate summary",
error: error.message
});
}
});
export default router;