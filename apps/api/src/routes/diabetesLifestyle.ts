import express, { Request, Response } from "express";
import Lifestyle from "../models/lifestyleModel";
import Patient from "../models/patient";
import Diabetes from "../models/diabetesModel";
import { SmartCareAI, LifestyleAIInput } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

// ✅ Create ONE shared instance instead of per-request
let smartCareAI: SmartCareAI | null = null;

const getAIService = () => {
  if (!smartCareAI) {
    console.log("🤖 Initializing SmartCareAI service for lifestyle...");
    smartCareAI = new SmartCareAI();
  }
  return smartCareAI;
};

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

    // Get latest glucose reading with ALL context
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

    // ✅ FIXED: Get language from vitals, not patient
    const language = (latestVitals?.language as "en" | "sw") || "en";
    console.log(`🌐 Using language from vitals: ${language}`);

    // Prepare COMPLETE input for AI with all available context
    const aiInput: LifestyleAIInput & {
      systolic?: number;
      diastolic?: number;
      heartRate?: number;
      exerciseRecent?: string;
      exerciseIntensity?: string;
    } = {
      glucose,
      context,
      language, // ✅ FROM VITALS!
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      lifestyle: { alcohol, smoking, exercise, sleep },
      // ✅ ADDITIONAL CONTEXT from latest vitals
      systolic: latestVitals?.systolic,
      diastolic: latestVitals?.diastolic,
      heartRate: latestVitals?.heartRate,
      exerciseRecent: latestVitals?.exerciseRecent,
      exerciseIntensity: latestVitals?.exerciseIntensity,
    };

    console.log("🤖 Generating lifestyle feedback with context:", {
      glucose: aiInput.glucose,
      context: aiInput.context,
      language: aiInput.language, // ✅ LOG IT
      bp: `${aiInput.systolic || 'N/A'}/${aiInput.diastolic || 'N/A'}`,
      hr: aiInput.heartRate || 'N/A',
      exercise: `${aiInput.exerciseRecent || 'N/A'} (${aiInput.exerciseIntensity || 'N/A'})`
    });

    const ai = getAIService();
    const aiAdvice = await ai.generateLifestyleFeedback(aiInput);
    
    lifestyleDoc.aiAdvice = aiAdvice;
    await lifestyleDoc.save();

    res.status(200).json({ 
      success: true, 
      recordId: lifestyleDoc._id, 
      aiAdvice,
      language, // ✅ RETURN THE LANGUAGE USED
      contextUsed: {
        glucose,
        context,
        language,
        bloodPressure: aiInput.systolic && aiInput.diastolic ? 
          `${aiInput.systolic}/${aiInput.diastolic}` : 'Not provided',
        heartRate: aiInput.heartRate || 'Not provided',
        exercise: aiInput.exerciseRecent && aiInput.exerciseIntensity ? 
          `${aiInput.exerciseRecent} (${aiInput.exerciseIntensity})` : 'Not provided'
      }
    });
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