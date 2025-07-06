import express, { Request, Response } from 'express';
import Medical from '../models/medical';

const router = express.Router();

// POST /api/medical - Save medical history
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      hypertension,
      diabetes,
      asthma,
      stroke,
      surgeries,
      allergies,
    } = req.body;

    const newMedical = new Medical({
      hypertension,
      diabetes,
      asthma,
      stroke,
      surgeries,
      allergies,
    });

    await newMedical.save();
    res.status(201).json({ message: 'Medical history saved successfully' });
  } catch (error) {
    console.error('Error saving medical history:', error);
    res.status(500).json({ error: 'Failed to save medical history' });
  }
});

export default router;
