import express, { Request, Response } from "express";
import { connectMongoDB } from "../lib/mongodb";
import { SmartCareAI } from "../services/SmartCareAI";

const router = express.Router();
const smartCareAI = new SmartCareAI();

connectMongoDB();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      medications = [],
      patientAge,
      conditions = [],
      language = "en",
    } = req.body;

    // Validate medications
    if (!Array.isArray(medications) || medications.length === 0) {
      res.status(400).json({ message: "Please provide a list of medications." });
      return;
    }

    let aiAnalysis = null;

    try {
      aiAnalysis = await smartCareAI.analyzeMedications({
        medications,
        patientAge,
        conditions,
        language,
      });
      console.log("✅ Medication analysis completed.");
    } catch (aiError: any) {
      console.error("❌ Medication analysis failed:", aiError.message);
    }

    res.status(200).json({
      message: "Medication analysis complete",
      aiAnalysis,
    });
  } catch (error: any) {
    console.error("❌ Server error:", error.message);
    res.status(500).json({
      message: "Server error during medication analysis",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
