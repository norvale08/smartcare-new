// apps/api/src/routes/hypertensionVitals.ts
import express, { Request, Response } from 'express';
import HypertensionVital from '../models/hypertensionVitals';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';
import { analyzeVitalsWithAI } from "../services/HypertensionAI";

const router = express.Router();

router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { systolic, diastolic, heartRate, activityType, duration, intensity, timeSinceActivity, notes } = req.body;
  const userId = req.user?.userId;

  if (!userId || systolic == null || diastolic == null || heartRate == null) {
    res.status(400).json({ message: 'userId and all vitals are required.' });
    return;
  }

  try {
    const vital = new HypertensionVital({
      userId,
      systolic,
      diastolic,
      heartRate,
      activityType,
      duration,
      intensity,
      timeSinceActivity,
      notes,
    });

    await vital.save();

    res.status(201).json({
      message: 'Vitals saved successfully',
      data: vital,
    });
  } catch (error) {
    console.error('Failed to save vitals:', error);
    res.status(500).json({ message: 'Server error while saving vitals.' });
  }
});

router.get('/me', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const vitals = await HypertensionVital.find({ userId }).sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ data: vitals });
  } catch (error) {
    console.error('Failed to fetch vitals:', error);
    res.status(500).json({ message: 'Server error while fetching vitals.' });
  }
});

router.post("/analyze", verifyToken, async (req: Request, res) => {
    try {
        const { vitals, activity } = req.body;
        if (!vitals || !activity) {
            return res.status(400).json({ message: "Vitals and activity context are required." });
        }
        const analysis = await analyzeVitalsWithAI({ vitals, activity });
        res.status(200).json(analysis);
    } catch (error) {
        console.error("Error analyzing vitals with AI:", error);
        res.status(500).json({ message: "Failed to analyze vitals" });
    }
});

export default router;