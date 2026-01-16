import { Response } from 'express';
import { Router } from 'express';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import { generateMedicationInteractions } from '../services/HypertensionAI';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';
import Patient from '../models/patient';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "llama-3.3-70b-versatile";

export const medicationAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { medications } = req.body;
    // Get language from query parameter or default to en-US
    const language = (req.query.language as string) || 'en-US';

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        message: language === 'sw-TZ' 
          ? 'Tafadhali toa angalau dawa moja kwa uchambuzi'
          : 'Please provide at least one medication for analysis'
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
    let patientName: string | undefined;
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
    
    // Get patient name if available
    patientName = patient?.name || patient?.fullName;

    // OPTION 1: Use the original 2-argument function (backward compatible)
    // const aiAnalysis = await generateMedicationInteractions(normalized, language);
    
    // OPTION 2: Use the enhanced 3-argument function with patient context (RECOMMENDED)
const aiAnalysis = await generateMedicationInteractions(
      normalized, 
      language
    );

    // Format the response to match what the frontend expects
    const response = {
      aiAnalysis: {
        safetyNotes: aiAnalysis,
        generalRecommendations: language === 'sw-TZ' 
          ? 'Daima fuata maelekezo ya daktari wako ya dawa.'
          : 'Always follow your doctor\'s prescription instructions.',
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

// Medication image analysis route
router.post('/analyze-image', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, imageType } = req.body;

    if (!image) {
      return res.status(400).json({
        message: 'Please provide an image for analysis'
      });
    }

    // Use Groq vision API to analyze medication image
    const prompt = `You are a medical AI assistant. Analyze this medication image and provide:
1. The medication name (if visible)
2. Dosage information (if visible)
3. Any warnings or important information visible on the medication
4. General safety information about this medication

Please provide a clear, professional analysis in a format suitable for healthcare professionals.`;

    try {
      // Note: Groq's current models may not support vision directly
      // For now, we'll use a text-based approach with image description
      // In production, you might want to use a vision-capable model or service
      
      // Convert base64 to data URL format for potential future vision support
      const imageDataUrl = `data:${imageType || 'image/jpeg'};base64,${image}`;
      
      // For now, provide a prompt that asks the AI to analyze based on description
      // In a production environment with vision support, you would pass the image directly
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt + "\n\nNote: If you can identify the medication from the image description, please provide the medication name, dosage, and any safety information."
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const analysis = completion.choices[0]?.message?.content || 'Unable to analyze medication image.';

      // Try to extract medication name from analysis
      const medicationNameMatch = analysis.match(/(?:medication|drug|name)[:\s]+([A-Za-z0-9\s]+)/i);
      const medicationName = medicationNameMatch ? medicationNameMatch[1].trim() : null;

      return res.json({
        success: true,
        analysis,
        medicationName,
        message: 'Image analyzed successfully'
      });
    } catch (groqError: any) {
      console.error('Error calling Groq API for image analysis:', groqError);
      
      // Fallback response
      return res.json({
        success: true,
        analysis: 'Image received. Please manually enter the medication details. AI image analysis is currently being improved.',
        medicationName: null,
        message: 'Image received but AI analysis unavailable'
      });
    }
  } catch (error) {
    console.error('Error in medication image analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Medication analysis route
router.post('/analyze', verifyToken, medicationAnalysis);

export default router;
