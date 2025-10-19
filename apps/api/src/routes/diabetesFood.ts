// routes/foodRecommendation.ts
import express, { Response } from "express";
import FoodRecommendation from "../models/foodRecommendationDiabetes";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { SmartCareAI, FoodAdviceInput } from "../services/SmartCareAI";

const router = express.Router();
const ai = new SmartCareAI();

// ✅ Helper to get userId safely
const getUserId = (req: AuthenticatedRequest): string | null => {
  return req.user?.userId || null;
};

// Generate new recommendation
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const newRec = new FoodRecommendation({ userId, isGenerating: true });
    await newRec.save();

    // Trigger AI in background
    ai.generateKenyanFoodAdvice(req.body as FoodAdviceInput).then(async (advice) => {
      newRec.foodAdvice = advice;
      newRec.isGenerating = false;
      await newRec.save();
    });

    res.json({ success: true, recordId: newRec._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to generate recommendation" });
  }
});

// Get latest recommendation
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const latest = await FoodRecommendation.findOne({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: latest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Get all history
router.get("/history", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const history = await FoodRecommendation.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Poll status
router.get("/status/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const rec = await FoodRecommendation.findById(req.params.id);
    if (!rec) return res.status(404).json({ success: false });

    // Security: ensure user owns this record
    if (rec.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({
      success: true,
      isGenerating: rec.isGenerating,
      foodAdvice: rec.foodAdvice,
      lastUpdated: rec.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
