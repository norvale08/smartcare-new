import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import Patient from "../models/patient";
import { SmartCareAI } from "../services/SmartCareAI";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();
const smartCareAI = new SmartCareAI();

router.options("*", (_req, res) => res.sendStatus(200));

// ✅ Define the AuthenticatedRequest interface directly in this file
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

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

// ✅ MAIN ENDPOINT: GET /api/diabetesAi/summary/:id
router.get("/summary/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    // ✅ Type assertion for authenticated request
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("🔍 Fetching vitals for ID:", req.params.id);
    const vitals = await Diabetes.findById(req.params.id);
    
    if (!vitals) {
      return res.status(404).json({ message: "Vitals not found" });
    }

    // ✅ Return existing summary immediately if available
    if (vitals.summary && vitals.summary.trim() !== "") {
      console.log("📋 Returning existing summary");
      return res.status(200).json({ 
        success: true,
        aiFeedback: vitals.summary, 
        cached: true 
      });
    }

    console.log("🔍 Fetching patient profile for userId:", userId);
    const patient = await Patient.findOne({ userId });
    
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const age = calculateAge(patient.dob);

    const glucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: (patient.language as "en" | "sw") || "en",
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
    };

    console.log("🧠 Generating AI summary for:", glucoseData);

    // Generate AI feedback
    const aiFeedback = await smartCareAI.generateSummary(glucoseData);

    // Save to database
    vitals.summary = aiFeedback;
    vitals.aiFeedback = aiFeedback;
    await vitals.save();

    console.log("✅ Summary generated and saved");

    // ✅ Return same format as lifestyle route
    res.status(200).json({ 
      success: true,
      aiFeedback, 
      cached: false 
    });
  } catch (error: any) {
    console.error("❌ Summary generation error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// ✅ Separate endpoint to check if summary is ready (polling endpoint)
router.get("/summary-status/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const vitals = await Diabetes.findById(req.params.id);
    
    if (!vitals) {
      return res.status(404).json({ 
        success: false, 
        message: "Vitals not found" 
      });
    }

    // Check if summary exists and is not an error message
    const hasSummary = vitals.summary && 
                       vitals.summary.trim() !== "" && 
                       !vitals.summary.includes("❌") && 
                       !vitals.summary.includes("⚠️");

    res.status(200).json({
      success: true,
      isGenerating: !hasSummary,
      aiFeedback: hasSummary ? vitals.summary : null,
      lastUpdated: vitals.updatedAt,
    });
  } catch (error: any) {
    console.error("❌ Summary status check error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

export default router;