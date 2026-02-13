// apps/api/src/routes/hypertensionVitals.ts
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import HypertensionVital from '../models/hypertensionVitals';
import Patient from '../models/patient';
import User from '../models/user';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';
import { analyzeVitalsWithAI } from "../services/HypertensionAI";
import { NotificationService } from "../services/NotificationService";
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
    await NotificationService.checkVitalAlerts(
      vital.toObject(), 
      userId, 
      userId // or patientId if you have it
    );

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

router.post("/analyze", verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { vitals, activity } = req.body;
        if (!vitals || !activity) {
            return res.status(400).json({ message: "Vitals and activity context are required." });
        }
        
        // Get language from query parameter or default to en-US
        const language = (req.query.language as string) || 'en-US';
        
        const analysis = await analyzeVitalsWithAI({ vitals, activity }, language);
        
        // If shouldNotifyDoctor is true, send notification to assigned doctors
        if (analysis.shouldNotifyDoctor && req.user?.userId) {
            try {
                const userId = req.user.userId;
                const patient = await Patient.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
                const patientName = patient?.fullName || `${patient?.firstname || ''} ${patient?.lastname || ''}`.trim() || 'Patient';
                
                // Find assigned doctors
                const doctors = await User.find({
                    role: 'doctor',
                    assignedPatients: userId
                });
                
                // Create notification message with AI recommendation
                const notificationMessage = language === 'sw-TZ'
                    ? `Arifa: Mgonjwa ${patientName} ana usomaji wa shinikizo la damu unaohitaji umakini.\n\nVitali: ${vitals.systolic}/${vitals.diastolic} mmHg, Kasi ya Moyo: ${vitals.heartRate} bpm\n\nUchambuzi: ${analysis.title}\n\nMaelezo: ${analysis.description}\n\nMapendekezo: ${analysis.recommendation}`
                    : `Alert: Patient ${patientName} has a blood pressure reading requiring attention.\n\nVitals: ${vitals.systolic}/${vitals.diastolic} mmHg, Heart Rate: ${vitals.heartRate} bpm\n\nAnalysis: ${analysis.title}\n\nDescription: ${analysis.description}\n\nRecommendation: ${analysis.recommendation}`;
                
                // Send notification to each assigned doctor
                for (const doctor of doctors) {
                    await NotificationService.createNotification({
                        userId: doctor._id.toString(),
                        type: 'vital_alert',
                        title: language === 'sw-TZ' ? 'Arifa ya Vitali' : 'Vital Alert',
                        message: notificationMessage,
                        patientId: userId,
                        patientName,
                        priority: analysis.severity === 'red' ? 'critical' : analysis.severity === 'yellow' ? 'high' : 'medium',
                        metadata: {
                            vitals,
                            activity,
                            analysis
                        }
                    });
                }
                
                
            } catch (notifError) {
                console.error('Error notifying doctors:', notifError);
                // Don't fail the request if notification fails
            }
        }
        
        res.status(200).json(analysis);
    } catch (error) {
        console.error("Error analyzing vitals with AI:", error);
        res.status(500).json({ message: "Failed to analyze vitals" });
    }
});

export default router;