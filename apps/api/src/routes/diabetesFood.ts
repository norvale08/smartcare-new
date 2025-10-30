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

// ✅ GET latest food advice for logged-in user
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestVitals) {
      return res.status(200).json({ success: true, data: null, message: "No recent glucose data found" });
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
    const advice = await aiService.generateKenyanFoodAdvice(foodInput);

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

    const input: FoodAdviceInput = req.body;

    // Ensure defaults
    input.context = input.context as "Fasting" | "Post-meal" | "Random" || "Random";
    input.language = input.language as "en" | "sw" || "en";

    input.lifestyle = {
      alcohol: input.lifestyle?.alcohol || "Unknown",
      smoking: input.lifestyle?.smoking || "Unknown",
      exercise: input.lifestyle?.exercise || "Unknown",
      sleep: input.lifestyle?.sleep || "Unknown",
    };

    input.allergies = Array.isArray(input.allergies)
      ? input.allergies
      : input.allergies
      ? [String(input.allergies)]
      : [];

    console.log("🤖 Generating advice for manual input:", JSON.stringify(input, null, 2));
    const advice = await aiService.generateKenyanFoodAdvice(input);

    res.status(200).json({ success: true, advice });
  } catch (error: any) {
    console.error("❌ Error generating food advice:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating food advice",
      error: error.message,
    });
  }
});

export default router;
