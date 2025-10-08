import express, { Request, Response } from "express";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

connectMongoDB();

// ✅ Allow preflight OPTIONS requests for all routes in this router
router.options("*", (_req, res) => res.sendStatus(200));

/**
 * ✅ POST /api/diabetesVitals
 * Save new vitals (glucose, context, etc.)
 */
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { glucose, context = "Random" } = req.body;

    if (!glucose) {
      return res.status(400).json({ message: "Glucose value is required" });
    }

    const newVitals = new Diabetes({
      ...req.body,
      userId: req.user.userId,
    });

    const saved = await newVitals.save();

    res.status(201).json({
      message: "✅ Diabetes vitals saved successfully",
      id: saved._id,
      data: saved,
    });

    console.log(`💾 New vitals saved for user ${req.user.userId}: ${saved._id}`);
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/diabetesVitals/me
 * Retrieve all vitals for the logged-in user
 */
router.get("/me", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const vitals = await Diabetes.find({ userId }).sort({ createdAt: -1 });

    if (!vitals.length) {
      return res.status(404).json({ message: "No vitals found for this user" });
    }

    res.status(200).json({
      message: "✅ User vitals retrieved successfully",
      data: vitals,
      count: vitals.length,
    });
  } catch (error: any) {
    console.error("❌ Error retrieving vitals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ GET /api/diabetesVitals/:id
 * Retrieve a specific vitals record by ID
 */
router.get("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const vitals = await Diabetes.findOne({ _id: req.params.id, userId });

    if (!vitals) {
      return res.status(404).json({ message: "Vitals not found" });
    }

    res.status(200).json({
      message: "✅ Vitals record retrieved successfully",
      data: vitals,
    });
  } catch (error: any) {
    console.error("❌ Error retrieving vitals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
