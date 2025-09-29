import express, { Response } from "express";
import Diabetes from "../models/diabetesModel";
import { SmartCareAI, type GlucoseData } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();
const smartCareAI = new SmartCareAI();

// ✅ Allow preflight OPTIONS
router.options("*", (_req, res) => res.sendStatus(200));

/**
 * GET /api/diabetesAi/summary/:id
 * Generate or return a brief AI summary of a vitals record
 */
router.get("/summary/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vitals = await Diabetes.findById(req.params.id);
    if (!vitals) {
      return res.status(404).json({ message: "Vitals not found" });
    }

    // 🔄 If already has AI feedback, return cached immediately
    if (vitals.aiFeedback) {
      return res.status(200).json({ aiFeedback: vitals.aiFeedback, summary: true });
    }

    const glucoseData: GlucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: (vitals.language as "en" | "sw") || "en",
    };

    const aiFeedback = await smartCareAI.generateSummary(glucoseData);

    // ✅ Save for next time
    vitals.aiFeedback = aiFeedback;
    await vitals.save();

    res.status(200).json({ aiFeedback, summary: true });
  } catch (error: any) {
    console.error("❌ AI summary error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
