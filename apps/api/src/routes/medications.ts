import { Response } from 'express';
import { Router } from 'express';
import mongoose from 'mongoose';
import { generateMedicationInteractions } from '../services/HypertensionAI';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';
import Patient from '../models/patient';

const router = Router();

export const medicationAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        message: 'Please provide at least one medication for analysis'
      });
    }

    // Normalize medications: allow array of strings or array of objects
    const normalized = (medications as any[]).map((m) => {
      if (typeof m === 'string') {
        return { name: m, dosage: 'unspecified', frequency: 'unspecified' };
      }
      const name = m?.name || m?.medicationName || 'unknown';
      const dosage = m?.dosage || 'unspecified';
      const frequency = m?.frequency || 'unspecified';
      return { name, dosage, frequency };
    });

    // Fetch patient age from profile (like lifestyle), using authenticated user
    let age: number | undefined;
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;
    const patient = await Patient.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    if (patient?.dob) {
      const birth = new Date(patient.dob);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let computed = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) computed--;
        age = computed;
      }
    }

    // Generate medication interactions using Groq with context
    const aiAnalysis = await generateMedicationInteractions(normalized, { age, condition: 'Hypertension' });

    // Format the response to match what the frontend expects
    const response = {
      aiAnalysis: {
        safetyNotes: aiAnalysis,
        generalRecommendations: 'Always follow your doctor\'s prescription instructions.',
        interactions: [] // This will be populated by AI analysis
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Error in medication analysis:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Medication analysis route
router.post('/analyze', verifyToken, medicationAnalysis);

export default router;
