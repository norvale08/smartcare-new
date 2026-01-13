import express, { Request, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import Patient from "../models/patient";
import Diabetes from "../models/diabetesModel";
import { SmartCareAI, FoodAdviceInput } from "../services/SmartCareAI";

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

// ✅ Helper function to get patient name
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

// ✅ Helper function to get selected diseases
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

// ✅ GET latest food advice for logged-in user (with language query param support)
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ✅ Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    console.log(`🌐 Requested language: ${requestedLanguage || 'not specified'}`);

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient);
    
    // ✅ GET SELECTED DISEASES
    const selectedDiseases = getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");
    
    console.log(`👤 Patient: ${patientName}`);
    console.log(`🏥 Disease Profile:`, {
      diseases: selectedDiseases,
      managementType: hasBothConditions ? "DUAL" : "DIABETES ONLY"
    });

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestVitals) {
      return res.status(200).json({ 
        success: true, 
        data: null, 
        patientName,
        selectedDiseases,
        conditions: {
          diabetes: selectedDiseases.includes("diabetes"),
          hypertension: selectedDiseases.includes("hypertension"),
        },
        message: "No recent glucose data found" 
      });
    }

    const age = calculateAge(patient.dob);

    // Use stored diseases from vitals or get from patient profile
    const vitalDiseases = latestVitals.selectedDiseases || selectedDiseases;

    // ✅ PRIORITY: query param → vitals → default
    const language = (requestedLanguage || latestVitals.language || "en") as "en" | "sw";
    console.log(`🌐 Using language: ${language} (source: ${requestedLanguage ? 'query param' : latestVitals.language ? 'vitals' : 'default'})`);

    // ✅ Use the correct interface structure with patient name and diseases
    const foodInput: FoodAdviceInput = {
      glucose: latestVitals.glucose,
      context: (latestVitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      systolic: latestVitals.systolic,
      diastolic: latestVitals.diastolic,
      heartRate: latestVitals.heartRate,
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      language: language, // ✅ Use prioritized language
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      exerciseRecent: latestVitals.exerciseRecent,
      exerciseIntensity: latestVitals.exerciseIntensity,
      lastMealTime: latestVitals.lastMealTime,
      mealType: latestVitals.mealType,
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

    console.log("🍽️ Food input prepared:", {
      glucose: foodInput.glucose,
      context: foodInput.context,
      language: foodInput.language,
      patientName: foodInput.patientName,
      selectedDiseases: foodInput.selectedDiseases,
      bp: `${foodInput.systolic || 'N/A'}/${foodInput.diastolic || 'N/A'}`,
      hr: foodInput.heartRate || 'N/A',
      exercise: `${foodInput.exerciseRecent || 'N/A'} (${foodInput.exerciseIntensity || 'N/A'})`,
      meal: foodInput.lastMealTime ? `${foodInput.mealType} (${foodInput.lastMealTime} ago)` : 'N/A'
    });

    const advice = await aiService.generateKenyanFoodAdvice(foodInput);

    const hasBoth = vitalDiseases.includes("diabetes") && vitalDiseases.includes("hypertension");

    res.status(200).json({
      success: true,
      data: {
        glucose: latestVitals.glucose,
        context: latestVitals.context,
        language,
        advice,
        patient: {
          name: patientName,
          age,
          gender: patient.gender,
          weight: patient.weight,
          height: patient.height,
          bloodPressure: latestVitals.systolic && latestVitals.diastolic 
            ? `${latestVitals.systolic}/${latestVitals.diastolic}`
            : 'Not recorded',
          heartRate: latestVitals.heartRate || 'Not recorded',
          exercise: latestVitals.exerciseRecent && latestVitals.exerciseIntensity
            ? `${latestVitals.exerciseRecent} (${latestVitals.exerciseIntensity})`
            : 'Not recorded'
        },
        patientName,
        selectedDiseases: vitalDiseases,
        diseaseManagement: hasBoth ? "dual" : "diabetes-only",
        conditions: {
          diabetes: vitalDiseases.includes("diabetes"),
          hypertension: vitalDiseases.includes("hypertension"),
        },
        contextUsed: {
          language,
          patientName: patientName,
          selectedDiseases: vitalDiseases,
          bloodPressure: foodInput.systolic && foodInput.diastolic ? 
            `${foodInput.systolic}/${foodInput.diastolic}` : 'Not provided',
          heartRate: foodInput.heartRate || 'Not provided',
          exercise: foodInput.exerciseRecent && foodInput.exerciseIntensity ? 
            `${foodInput.exerciseRecent} (${foodInput.exerciseIntensity})` : 'Not provided',
          mealTiming: foodInput.lastMealTime ? `${foodInput.mealType} (${foodInput.lastMealTime} ago)` : 'Not provided'
        }
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching latest food advice:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching food advice",
      error: error.message,
    });
  }
});

// ✅ POST generate new food advice manually (with language support)
router.post("/advice", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get patient info for name and diseases
    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient);
    const age = calculateAge(patient.dob);
    
    // ✅ GET SELECTED DISEASES
    const selectedDiseases = getPatientDiseases(patient);

    // ✅ Language from request body or default
    const requestedLanguage = req.body.language as "en" | "sw" | undefined;
    const language = (requestedLanguage || "en") as "en" | "sw";
    console.log(`🌐 Manual advice language: ${language}`);

    // ✅ Use the correct input structure with patient name and diseases
    const input: FoodAdviceInput = {
      ...req.body,
      context: (req.body.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: language, // ✅ Use processed language
      patientName: patientName,
      selectedDiseases: selectedDiseases,
      age: req.body.age || age,
      gender: req.body.gender || patient.gender,
      weight: req.body.weight || patient.weight,
      height: req.body.height || patient.height,
      systolic: req.body.systolic || undefined,
      diastolic: req.body.diastolic || undefined,
      heartRate: req.body.heartRate || undefined,
      exerciseRecent: req.body.exerciseRecent || undefined,
      exerciseIntensity: req.body.exerciseIntensity || undefined,
      lastMealTime: req.body.lastMealTime || undefined,
      mealType: req.body.mealType || undefined,
      lifestyle: req.body.lifestyle ? {
        alcohol: req.body.lifestyle.alcohol || "Unknown",
        smoking: req.body.lifestyle.smoking || "Unknown",
        exercise: req.body.lifestyle.exercise || "Unknown",
        sleep: req.body.lifestyle.sleep || "Unknown",
      } : undefined,
      allergies: Array.isArray(req.body.allergies)
        ? req.body.allergies
        : req.body.allergies
        ? [String(req.body.allergies)]
        : [],
      medicalHistory: Array.isArray(req.body.medicalHistory)
        ? req.body.medicalHistory
        : req.body.medicalHistory
        ? [String(req.body.medicalHistory)]
        : [],
    };

    console.log("🤖 Generating advice for manual input:", {
      glucose: input.glucose,
      context: input.context,
      language: input.language,
      patientName: input.patientName,
      selectedDiseases: input.selectedDiseases,
      bp: `${input.systolic || 'N/A'}/${input.diastolic || 'N/A'}`,
      hr: input.heartRate || 'N/A',
      exercise: `${input.exerciseRecent || 'N/A'} (${input.exerciseIntensity || 'N/A'})`
    });

    const advice = await aiService.generateKenyanFoodAdvice(input);

    const hasBoth = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

    res.status(200).json({ 
      success: true, 
      advice,
      patientName,
      selectedDiseases,
      diseaseManagement: hasBoth ? "dual" : "diabetes-only",
      conditions: {
        diabetes: selectedDiseases.includes("diabetes"),
        hypertension: selectedDiseases.includes("hypertension"),
      },
      language: input.language,
      contextUsed: {
        language: input.language,
        patientName: patientName,
        selectedDiseases,
        bloodPressure: input.systolic && input.diastolic ? 
          `${input.systolic}/${input.diastolic}` : 'Not provided',
        heartRate: input.heartRate || 'Not provided',
        exercise: input.exerciseRecent && input.exerciseIntensity ? 
          `${input.exerciseRecent} (${input.exerciseIntensity})` : 'Not provided',
        mealTiming: input.lastMealTime ? `${input.mealType} (${input.lastMealTime} ago)` : 'Not provided'
      }
    });
  } catch (error: any) {
    console.error("❌ Error generating food advice:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating food advice",
      error: error.message,
    });
  }
});

// ✅ GET food advice by specific vital ID (with language query param support)
router.get("/vital/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const vitalId = req.params.id;
    
    // ✅ Extract language from query parameter
    const requestedLanguage = req.query.language as "en" | "sw" | undefined;
    console.log(`🌐 Requested language for vital ${vitalId}: ${requestedLanguage || 'not specified'}`);
    
    // Fetch specific vital record
    const vital = await Diabetes.findOne({ _id: vitalId, userId });
    if (!vital) {
      return res.status(404).json({ success: false, message: "Vital record not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient);
    const age = calculateAge(patient.dob);
    
    // ✅ GET SELECTED DISEASES - prefer vitals, fallback to patient profile
    const selectedDiseases = vital.selectedDiseases || getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");

    // ✅ PRIORITY: query param → vitals → default
    const language = (requestedLanguage || vital.language || "en") as "en" | "sw";
    console.log(`🌐 Using language: ${language} (source: ${requestedLanguage ? 'query param' : vital.language ? 'vitals' : 'default'})`);
    console.log(`🏥 Disease context:`, {
      diseases: selectedDiseases,
      managementType: hasBothConditions ? "DUAL" : "DIABETES ONLY"
    });

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
      language: language, // ✅ Use prioritized language
      patientName: patientName,
      selectedDiseases: selectedDiseases,
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

    console.log(`🍽️ Food advice for vital ${vitalId}:`, {
      glucose: foodInput.glucose,
      context: foodInput.context,
      language: foodInput.language,
      patientName: foodInput.patientName,
      selectedDiseases: foodInput.selectedDiseases,
      bp: `${foodInput.systolic || 'N/A'}/${foodInput.diastolic || 'N/A'}`,
      exercise: `${foodInput.exerciseRecent || 'N/A'} (${foodInput.exerciseIntensity || 'N/A'})`
    });

    const advice = await aiService.generateKenyanFoodAdvice(foodInput);

    res.status(200).json({
      success: true,
      data: {
        vitalId: vital._id,
        glucose: vital.glucose,
        context: vital.context,
        language,
        advice,
        patientName,
        selectedDiseases,
        diseaseManagement: hasBothConditions ? "dual" : "diabetes-only",
        conditions: {
          diabetes: selectedDiseases.includes("diabetes"),
          hypertension: selectedDiseases.includes("hypertension"),
        },
        contextUsed: {
          language,
          patientName: patientName,
          selectedDiseases,
          bloodPressure: foodInput.systolic && foodInput.diastolic ? 
            `${foodInput.systolic}/${foodInput.diastolic}` : 'Not provided',
          heartRate: foodInput.heartRate || 'Not provided',
          exercise: foodInput.exerciseRecent && foodInput.exerciseIntensity ? 
            `${foodInput.exerciseRecent} (${foodInput.exerciseIntensity})` : 'Not provided',
          mealTiming: foodInput.lastMealTime ? `${foodInput.mealType} (${foodInput.lastMealTime} ago)` : 'Not provided'
        }
      },
    });
  } catch (error: any) {
    console.error("❌ Error generating food advice for vital:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating food advice",
      error: error.message,
    });
  }
});

export default router;