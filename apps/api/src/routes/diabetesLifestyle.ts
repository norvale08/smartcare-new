import express, { Response } from "express";
import Lifestyle from "../models/lifestyleModel"; // Adjust path as needed
import Patient from "../models/patient";
import { SmartCareAI } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();
const smartCareAI = new SmartCareAI();

router.options("*", (_req, res) => res.sendStatus(200));

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

/**
 * ✅ POST /api/lifestyle
 * Save lifestyle data WITHOUT generating AI (async generation)
 */
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { alcohol, smoking, exercise, sleep } = req.body;

    if (!alcohol || !smoking || !exercise || !sleep) {
      return res.status(400).json({ message: "All lifestyle fields are required" });
    }

    // Create or update lifestyle record
    let lifestyle = await Lifestyle.findOne({ userId });

    if (lifestyle) {
      // Update existing
      lifestyle.alcohol = alcohol;
      lifestyle.smoking = smoking;
      lifestyle.exercise = exercise;
      lifestyle.sleep = sleep;
      lifestyle.isGenerating = true;
      lifestyle.aiAdvice = undefined; // Clear old advice
      await lifestyle.save();
    } else {
      // Create new
      lifestyle = new Lifestyle({
        userId,
        alcohol,
        smoking,
        exercise,
        sleep,
        isGenerating: true,
      });
      await lifestyle.save();
    }

    console.log(`💾 Lifestyle data saved for user ${userId}: ${lifestyle._id}`);

    // Start AI generation in background (don't await)
    generateLifestyleAIAsync(lifestyle._id.toString(), userId);

    res.status(201).json({
      message: "✅ Lifestyle data saved successfully",
      recordId: lifestyle._id,
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Lifestyle save error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/lifestyle/latest
 * Get the latest lifestyle record for the user
 */
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lifestyle = await Lifestyle.findOne({ userId }).sort({ updatedAt: -1 });

    if (!lifestyle) {
      return res.status(404).json({ message: "No lifestyle data found", success: false });
    }

    res.status(200).json({
      message: "✅ Lifestyle data retrieved",
      data: lifestyle,
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Error retrieving lifestyle data:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/lifestyle/advice/:id
 * Poll for AI advice generation status
 */
router.get("/advice/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const lifestyle = await Lifestyle.findById(req.params.id);

    if (!lifestyle) {
      return res.status(404).json({ message: "Lifestyle record not found", success: false });
    }

    // Security: Verify ownership
    if (lifestyle.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: Access denied", success: false });
    }

    res.status(200).json({
      success: true,
      isGenerating: lifestyle.isGenerating || false,
      aiAdvice: lifestyle.aiAdvice || null,
      lastUpdated: lifestyle.updatedAt,
    });
  } catch (error: any) {
    console.error("❌ Error fetching AI advice:", error.message);
    res.status(500).json({ message: "Server error", error: error.message, success: false });
  }
});

/**
 * 🔄 Background AI generation (async - doesn't block response)
 */
async function generateLifestyleAIAsync(lifestyleId: string, userId: string) {
  try {
    console.log(`🧠 Starting background AI generation for lifestyle ${lifestyleId}`);

    const lifestyle = await Lifestyle.findById(lifestyleId);
    if (!lifestyle) {
      console.error("❌ Lifestyle record not found for AI generation");
      return;
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      console.error("❌ Patient profile not found for AI generation");
      return;
    }

    // Get the latest vitals for glucose context
    const Diabetes = require("../models/diabetesModel").default;
    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });

    if (!latestVitals) {
      lifestyle.aiAdvice = "⚠️ Please submit glucose vitals first to get personalized advice.";
      lifestyle.isGenerating = false;
      await lifestyle.save();
      return;
    }

    const age = calculateAge(patient.dob);

    const lifestyleInput = {
      glucose: latestVitals.glucose,
      context: latestVitals.context as "Fasting" | "Post-meal" | "Random",
      language: (latestVitals.language as "en" | "sw") || "en",
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      lifestyle: {
        alcohol: lifestyle.alcohol,
        smoking: lifestyle.smoking,
        exercise: lifestyle.exercise,
        sleep: lifestyle.sleep,
      },
    };

    console.log(`🤖 Generating lifestyle AI advice:`, lifestyleInput);

    const aiAdvice = await smartCareAI.generateLifestyleFeedback(lifestyleInput);

    lifestyle.aiAdvice = aiAdvice;
    lifestyle.isGenerating = false;
    await lifestyle.save();

    console.log(`✅ AI advice generated for lifestyle ${lifestyleId}`);
  } catch (error: any) {
    console.error("❌ Background AI generation error:", error.message);

    // Mark as failed
    try {
      const lifestyle = await Lifestyle.findById(lifestyleId);
      if (lifestyle) {
        lifestyle.aiAdvice = "❌ Failed to generate AI advice. Please try refreshing.";
        lifestyle.isGenerating = false;
        await lifestyle.save();
      }
    } catch (saveError) {
      console.error("Failed to update lifestyle record after error:", saveError);
    }
  }
}

export default router;