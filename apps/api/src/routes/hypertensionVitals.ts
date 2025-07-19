// apps/api/src/routes/hypertensionVitals.ts
import express, { Request, Response } from 'express';
import HypertensionVital from '../models/hypertensionVitals';


const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { systolic, diastolic, heartRate } = req.body;

  if ( !systolic || !diastolic || !heartRate) {
    res.status(400).json({ message: 'All vitals are required.' });
    return;
  }

  try {
    const vital = new HypertensionVital({
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

export default router;