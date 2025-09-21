import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const EmergencySchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phonenumber: { type: String, required: true },
  relationship: { type: String, required: true },
});

const Emergency = mongoose.models.Emergency || mongoose.model('Emergency', EmergencySchema);

// POST /api/emergency
router.post('/', async (req, res) => {
  try {
    const emergency = new Emergency(req.body);
    await emergency.save();
    res.status(201).json({ message: 'Emergency contact saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save emergency contact' });
  }
});

export default router;
