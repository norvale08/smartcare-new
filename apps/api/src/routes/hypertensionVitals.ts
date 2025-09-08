// apps/api/src/routes/hypertensionVitals.ts
import express, { Request, Response } from 'express';
import HypertensionVital from '../models/hypertensionVitals';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { systolic, diastolic, heartRate } = req.body;
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

export default router;