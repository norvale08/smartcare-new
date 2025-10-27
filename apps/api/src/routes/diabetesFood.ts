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

// ✅ UPDATED: GET latest food advice
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log("🔍 User ID:", userId);
    
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const patient = await Patient.findOne({ userId });
    console.log("👤 Patient found:", patient ? "Yes" : "No");
    
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    console.log("📊 Latest vitals found:", latestVitals ? "Yes" : "No");
    
    if (!latestVitals) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No recent glucose data found",
      });
    }

    const age = calculateAge(patient.dob);

    const foodInput: FoodAdviceInput = {
      glucose: latestVitals.glucose,
      context: (latestVitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      weight: patient.weight,
      height: patient.height,
      age,
      gender: patient.gender,
      bloodPressure: latestVitals.bloodPressure || undefined,
      language: (patient.language as "en" | "sw") || "en",
      lifestyle: {
        alcohol: patient.lifestyle?.alcohol || "Unknown",
        smoking: patient.lifestyle?.smoking || "Unknown",
        exercise: patient.lifestyle?.exercise || "Unknown",
        sleep: patient.lifestyle?.sleep || "Unknown",
      },
      allergies: Array.isArray(patient.allergies)
        ? patient.allergies
        : patient.allergies
        ? [String(patient.allergies)]
        : [],
    };

    console.log("🍽️ Food input prepared:", JSON.stringify(foodInput, null, 2));
    console.log("🤖 Calling AI service...");
    
    const advice = await aiService.generateKenyanFoodAdvice(foodInput);
    
    console.log("✅ AI advice received:", Object.keys(advice));

    res.status(200).json({
      success: true,
      data: {
        glucose: latestVitals.glucose,
        context: latestVitals.context,
        advice,
        patient: {
          name: patient.name,
          age,
          gender: patient.gender,
          weight: patient.weight,
          height: patient.height,
          bloodPressure: latestVitals.bloodPressure,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Full error details:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching food advice",
      error: error.message,
    });
  }
});

// ✅ UPDATED: POST generate new food advice
router.post("/advice", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const input: FoodAdviceInput = req.body;

    if (!input.context) input.context = "Random";

    if (input.allergies && !Array.isArray(input.allergies)) {
      input.allergies = [String(input.allergies)];
    } else if (!input.allergies) {
      input.allergies = [];
    }

    input.lifestyle = {
      alcohol: input.lifestyle?.alcohol || "Unknown",
      smoking: input.lifestyle?.smoking || "Unknown",
      exercise: input.lifestyle?.exercise || "Unknown",
      sleep: input.lifestyle?.sleep || "Unknown",
    };

    console.log("🤖 Generating advice for manual input");
    const advice = await aiService.generateKenyanFoodAdvice(input);

    res.status(200).json({ success: true, advice });
  } catch (error: any) {
    console.error("❌ Error generating food advice:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error generating food advice",
      error: error.message,
    });
  }
});

export default router;