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

// ✅ GET latest food advice for logged-in user
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME
    console.log(`👤 Patient: ${patientName}`);

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestVitals) {
      return res.status(200).json({ 
        success: true, 
        data: null, 
        patientName, // ✅ RETURN PATIENT NAME
        message: "No recent glucose data found" 
      });
    }

    const age = calculateAge(patient.dob);

    // ✅ FIXED: Get language from vitals, not patient
    const language = (latestVitals.language as "en" | "sw") || "en";
    console.log(`🌐 Using language from vitals: ${language}`);

    // ✅ UPDATED: Use the correct interface structure with patient name
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
      language, // ✅ FROM VITALS!
      patientName: patientName, // ✅ ADDED PATIENT NAME
      // ✅ ADD: Exercise context from vitals
      exerciseRecent: latestVitals.exerciseRecent,
      exerciseIntensity: latestVitals.exerciseIntensity,
      // ✅ ADD: Meal timing context for post-meal readings
      lastMealTime: latestVitals.lastMealTime,
      mealType: latestVitals.mealType,
      // Lifestyle data (optional)
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
      patientName: foodInput.patientName, // ✅ LOG PATIENT NAME
      bp: `${foodInput.systolic || 'N/A'}/${foodInput.diastolic || 'N/A'}`,
      hr: foodInput.heartRate || 'N/A',
      exercise: `${foodInput.exerciseRecent || 'N/A'} (${foodInput.exerciseIntensity || 'N/A'})`,
      meal: foodInput.lastMealTime ? `${foodInput.mealType} (${foodInput.lastMealTime} ago)` : 'N/A'
    });

    const advice = await aiService.generateKenyanFoodAdvice(foodInput);

    res.status(200).json({
      success: true,
      data: {
        glucose: latestVitals.glucose,
        context: latestVitals.context,
        language, // ✅ RETURN THE LANGUAGE
        advice,
        patient: {
          name: patientName, // ✅ USE PROPER NAME
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
        patientName, // ✅ ALSO RETURN AT TOP LEVEL
        contextUsed: {
          language,
          patientName: patientName,
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

// ✅ POST generate new food advice manually
router.post("/advice", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get patient info for name
    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME
    const age = calculateAge(patient.dob);

    // ✅ UPDATED: Use the correct input structure with patient name
    const input: FoodAdviceInput = {
      ...req.body,
      context: (req.body.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: (req.body.language as "en" | "sw") || "en",
      patientName: patientName, // ✅ ADDED PATIENT NAME
      age: req.body.age || age, // Use provided age or calculate
      gender: req.body.gender || patient.gender,
      weight: req.body.weight || patient.weight,
      height: req.body.height || patient.height,
      // Ensure optional fields are properly set
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
      patientName: input.patientName, // ✅ LOG PATIENT NAME
      bp: `${input.systolic || 'N/A'}/${input.diastolic || 'N/A'}`,
      hr: input.heartRate || 'N/A',
      exercise: `${input.exerciseRecent || 'N/A'} (${input.exerciseIntensity || 'N/A'})`
    });

    const advice = await aiService.generateKenyanFoodAdvice(input);

    res.status(200).json({ 
      success: true, 
      advice,
      patientName, // ✅ RETURN PATIENT NAME
      language: input.language,
      contextUsed: {
        language: input.language,
        patientName: patientName,
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

// ✅ NEW: GET food advice by specific vital ID
router.get("/vital/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const vitalId = req.params.id;
    
    // Fetch specific vital record
    const vital = await Diabetes.findOne({ _id: vitalId, userId });
    if (!vital) {
      return res.status(404).json({ success: false, message: "Vital record not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientName = getPatientName(patient); // ✅ GET PATIENT NAME
    const age = calculateAge(patient.dob);

    // ✅ FIXED: Get language from vitals, not patient
    const language = (vital.language as "en" | "sw") || "en";
    console.log(`🌐 Using language from vital ${vitalId}: ${language}`);

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
      language, // ✅ FROM VITALS!
      patientName: patientName, // ✅ ADDED PATIENT NAME
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
      patientName: foodInput.patientName, // ✅ LOG PATIENT NAME
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
        language, // ✅ RETURN IT
        advice,
        patientName, // ✅ RETURN PATIENT NAME
        contextUsed: {
          language,
          patientName: patientName,
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