import express, { Response } from "express";
import Diabetes from "../models/diabetesModel";
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

router.get("/summary/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User ID missing from token" });
    }

    const vitals = await Diabetes.findById(req.params.id);
    if (!vitals) {
      return res.status(404).json({ message: "Vitals not found" });
    }

    // ✅ Security: Verify the vitals belong to the requesting user
    if (vitals.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // ✅ Check if summary already exists to avoid regeneration
    if (vitals.summary) {
      console.log(`📋 Using existing summary for vitals ${req.params.id}`);
      return res.status(200).json({ aiFeedback: vitals.summary, summary: true, cached: true });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const age = calculateAge(patient.dob);

    const glucoseData = {
      glucose: vitals.glucose,
      context: (vitals.context as "Fasting" | "Post-meal" | "Random") || "Random",
      language: (vitals.language as "en" | "sw") || "en",
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
    };

    console.log("🧠 Generating new AI summary:", glucoseData);

    const aiFeedback = await smartCareAI.generateSummary(glucoseData);

    // ✅ Only save to 'summary' field - remove aiFeedback assignment
    vitals.summary = aiFeedback;
    // ❌ REMOVE THIS LINE: vitals.aiFeedback = aiFeedback;
    await vitals.save();

    res.status(200).json({ aiFeedback, summary: true, cached: false });
  } catch (error: any) {
    console.error("❌ AI summary generation error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;