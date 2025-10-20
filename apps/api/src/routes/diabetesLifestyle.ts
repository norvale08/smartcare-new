// routes/lifestyle.ts
import express, { Request, Response } from "express";
import Lifestyle from "../models/lifestyleModel";
import Patient from "../models/patient";
import Diabetes from "../models/diabetesModel";
import { SmartCareAI, LifestyleAIInput } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();
const smartCareAI = new SmartCareAI();

// Utility: calculate age from DOB
const calculateAge = (dob: Date | string | undefined): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age : 0;
};

// ✅ GET latest lifestyle for user
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const latestLifestyle = await Lifestyle.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestLifestyle) return res.status(200).json({ success: true, data: null });

    res.status(200).json({ success: true, data: latestLifestyle });
  } catch (error: any) {
    console.error("❌ Fetch latest lifestyle error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ POST new lifestyle
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { alcohol, smoking, exercise, sleep } = req.body;

    // Validate required fields
    if (!alcohol || !smoking || !exercise || !sleep) {
      return res.status(400).json({ message: "All lifestyle fields are required" });
    }

    // Fetch patient info
    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const age = calculateAge(patient.dob);

    // Get latest glucose reading
    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    const glucose = latestVitals?.glucose || 0;
    const context = (latestVitals?.context as "Fasting" | "Post-meal" | "Random") || "Random";

    // Save lifestyle
    const lifestyleDoc = new Lifestyle({
      userId,
      alcohol,
      smoking,
      exercise,
      sleep,
      glucoseContext: {
        glucose,
        context,
        readingDate: latestVitals?.createdAt || new Date(),
      },
    });
    await lifestyleDoc.save();

    // Prepare input for AI
    const aiInput: LifestyleAIInput = {
      glucose,
      context,
      language: patient.language as "en" | "sw" || "en",
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      lifestyle: { alcohol, smoking, exercise, sleep },
    };

    const aiAdvice = await smartCareAI.generateLifestyleFeedback(aiInput);
    lifestyleDoc.aiAdvice = aiAdvice;
    await lifestyleDoc.save();

    res.status(200).json({ success: true, recordId: lifestyleDoc._id, aiAdvice });
  } catch (error: any) {
    console.error("❌ Save lifestyle error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ NEW: GET AI advice by record ID
router.get("/advice/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lifestyle = await Lifestyle.findById(id);

    if (!lifestyle) {
      return res.status(404).json({ success: false, message: "Lifestyle record not found" });
    }

    // If AI advice is still being generated (optional)
    if (!lifestyle.aiAdvice || lifestyle.aiAdvice === "") {
      return res.status(200).json({
        success: true,
        isGenerating: true,
        aiAdvice: null,
        lastUpdated: lifestyle.updatedAt,
      });
    }

    // AI advice available
    res.status(200).json({
      success: true,
      isGenerating: false,
      aiAdvice: lifestyle.aiAdvice,
      lastUpdated: lifestyle.updatedAt,
    });
  } catch (error: any) {
    console.error("❌ Fetch lifestyle advice error:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
