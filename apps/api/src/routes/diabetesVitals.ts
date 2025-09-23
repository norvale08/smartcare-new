import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";
import { SmartCareAI, type GlucoseData } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();
const smartCareAI = new SmartCareAI();

connectMongoDB();

// ✅ Allow preflight OPTIONS requests for all routes in this router
router.options("*", (_req, res) => res.sendStatus(200));

/**
 * POST /api/diabetesVitals
 * Save new vitals immediately + generate AI feedback asynchronously
 */
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { glucose, context = "Random", language = "en", requestAI } = req.body;

    const newVitals = new Diabetes({
      ...req.body,
      userId: req.user.userId,
    });

    const saved = await newVitals.save();

    // Respond immediately without waiting for AI
    res.status(201).json({
      message: "✅ Diabetes vitals saved successfully",
      id: saved._id,
      data: saved,
      aiFeedback: null,
      aiProcessing: !!requestAI,
    });

    // Generate AI feedback in background
    if (requestAI && typeof glucose === "number" && glucose > 0) {
      try {
        const glucoseData: GlucoseData = {
          glucose,
          context: context as "Fasting" | "Post-meal" | "Random",
          language: language as "en" | "sw",
        };

        const aiFeedback = await smartCareAI.generateGlucoseFeedback(glucoseData);

        // Update the vitals record with AI feedback
        await Diabetes.findByIdAndUpdate(saved._id, { aiFeedback });
        console.log(`✅ AI feedback saved for vitals ${saved._id}`);
      } catch (aiError: any) {
        console.error("❌ AI feedback generation failed:", aiError.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/diabetesVitals/me
 * Retrieve vitals for the logged-in user
 */
router.get("/me", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const vitals = await Diabetes.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      message: "✅ User vitals retrieved successfully",
      data: vitals,
      count: vitals.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/diabetesVitals/ai/:id
 * Retrieve AI feedback for a specific vitals record
 */
router.get("/ai/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vitals = await Diabetes.findById(req.params.id);
    if (!vitals) {
      return res.status(404).json({ message: "Vital record not found" });
    }

    res.status(200).json({
      aiFeedback: vitals.aiFeedback || null,
      aiProcessing: !vitals.aiFeedback,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
