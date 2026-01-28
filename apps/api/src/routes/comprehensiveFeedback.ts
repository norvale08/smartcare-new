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

//  Helper function to get patient name
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

//  Helper function to get selected diseases
const getPatientDiseases = (patient: any): ("diabetes" | "hypertension")[] => {
  const diseases: ("diabetes" | "hypertension")[] = [];
  
  if (!patient) {
    return ["diabetes"];
  }
  
  if (patient.diabetes === true) {
    diseases.push("diabetes");
  }
  
  if (patient.hypertension === true) {
    diseases.push("hypertension");
  }
  
  if (diseases.length === 0) {
    diseases.push("diabetes");
  }
  
  return diseases;
};

//  GET comprehensive AI feedback (with language query param support)
router.get("/comprehensive-feedback/:vitalId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const vitalId = req.params.vitalId;
    
    //  Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    
    
    // Validate vitalId
    if (!vitalId || vitalId === 'undefined' || vitalId === 'null') {
      return res.status(400).json({ 
        success: false,
        message: "Valid vital ID is required" 
      });
    }

    

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
    const patientName = getPatientName(patient);
    
    //  GET SELECTED DISEASES
    const selectedDiseases = vital.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

   

    //  PRIORITY: query param → vital → patient → lifestyle → default
    const language = (
      requestedLanguage || 
      vital.language || 
      patient.language || 
      latestLifestyle?.language || 
      "en"
    ) as "en" | "sw";
    
    
    // Prepare data for AI with diseases and prioritized language
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
      language: language, //  Use prioritized language
      exerciseRecent: vital.exerciseRecent,
      exerciseIntensity: vital.exerciseIntensity,
      lastMealTime: vital.lastMealTime,
      mealType: vital.mealType,
      patientName: patientName,
      selectedDiseases: selectedDiseases,
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

   

    // Generate all AI components in parallel for better performance
    const [summary, foodAdvice, quickTips] = await Promise.all([
      aiService.generateSummary(foodInput),
      aiService.generateKenyanFoodAdvice(foodInput),
      aiService.generateQuickTips(foodInput)
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

    // Generate comprehensive final feedback with diseases and language
    const comprehensiveInput: ComprehensiveFeedbackInput = {
      summary,
      foodAdvice,
      quickTips,
      lifestyleFeedback,
      vitalData: vital,
      patientData: patient,
      hasBloodPressure: !!(vital.systolic && vital.diastolic),
      hasHeartRate: !!vital.heartRate,
      language: language, 
      patientName: patientName,
      selectedDiseases: selectedDiseases,
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
        patientInfo: {
          name: patientName,
          selectedDiseases,
          diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
          conditions: {
            diabetes: selectedDiseases.includes("diabetes"),
            hypertension: selectedDiseases.includes("hypertension"),
          }
        },
        context: {
          glucose: vital.glucose,
          context: vital.context,
          language: language,
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
          completeLifestyle: !latestLifestyle,
          bloodPressureRequired: selectedDiseases.includes("hypertension") && (!vital.systolic || !vital.diastolic)
        }
      },
    });
  } catch (error: any) {
    console.error(" Error generating comprehensive feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating comprehensive feedback",
      error: error.message,
    });
  }
});

//  Get comprehensive feedback using latest glucose reading (with language query param support)
router.get("/latest-comprehensive-feedback", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    //  Extract language from query parameter to pass along
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
   

    // Get latest glucose reading
    const latestVital = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!latestVital) {
      return res.status(404).json({
        success: false,
        message: "No glucose readings found. Please add a reading first."
      });
    }

    //  Preserve language query parameter in redirect
    const redirectUrl = requestedLanguage 
      ? `/api/comprehensive-feedback/${latestVital._id}?language=${requestedLanguage}`
      : `/api/comprehensive-feedback/${latestVital._id}`;
    
   
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error(" Error getting latest comprehensive feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;