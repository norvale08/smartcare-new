// apps/api/src/routes/patientVitals.ts
import express, { Request, Response } from 'express';
import HypertensionVital from '../models/hypertensionVitals';
import Diabetes from '../models/diabetesModel';
import Patient from '../models/patient';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';

const router = express.Router();

router.get('/:patientId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user?.userId;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    console.log(`🩺 Fetching vitals for patient ${patientId} by doctor ${doctorId}`);

    // Find patient by userId
    const patient = await Patient.findOne({ userId: patientId });
    
    if (!patient) {
      
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    

    let vitals: any[] = [];

    // FIX: Handle undefined condition by checking BOTH collections
    if (!patient.condition || patient.condition === 'undefined') {
     
      // Search both hypertension and diabetes collections
      const [hypertensionVitals, diabetesVitals] = await Promise.all([
        HypertensionVital.find({ 
          $or: [
            { userId: patientId },
            { patientId: patientId }
          ]
        }).sort({ createdAt: -1 }).limit(100),
        
        Diabetes.find({ 
          $or: [
            { userId: patientId },
            { patientId: patientId }
          ]
        }).sort({ createdAt: -1 }).limit(100)
      ]);

     

      // Combine both types of vitals
      vitals = [
        ...hypertensionVitals.map(vital => ({
          id: vital._id.toString(),
          systolic: vital.systolic,
          diastolic: vital.diastolic,
          heartRate: vital.heartRate,
          glucose: undefined,
          timestamp: vital.createdAt.toISOString(),
          patientId: patientId,
          type: 'hypertension',
          source: 'hypertension'
        })),
        ...diabetesVitals.map(vital => ({
          id: vital._id.toString(),
          systolic: vital.systolic,
          diastolic: vital.diastolic,
          heartRate: vital.heartRate,
          glucose: vital.glucose,
          timestamp: vital.createdAt.toISOString(),
          patientId: patientId,
          type: 'diabetes',
          source: 'diabetes'
        }))
      ];

    } else if (patient.condition === 'hypertension' || patient.condition === 'both') {
      // Get hypertension vitals for this patient
      const hypertensionVitals = await HypertensionVital.find({
        $or: [
          { userId: patientId },
          { patientId: patientId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(100);

     
      vitals = hypertensionVitals.map(vital => ({
        id: vital._id.toString(),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        heartRate: vital.heartRate,
        glucose: undefined,
        timestamp: vital.createdAt.toISOString(),
        patientId: patientId,
        type: 'hypertension',
        source: 'hypertension'
      }));

    } else if (patient.condition === 'diabetes') {
      // Get diabetes vitals for this patient
      const diabetesVitals = await Diabetes.find({
        $or: [
          { userId: patientId },
          { patientId: patientId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(100);

     
      vitals = diabetesVitals.map(vital => ({
        id: vital._id.toString(),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        heartRate: vital.heartRate,
        glucose: vital.glucose,
        timestamp: vital.createdAt.toISOString(),
        patientId: patientId,
        type: 'diabetes',
        source: 'diabetes'
      }));
    }

    // Sort all vitals by timestamp (newest first)
    vitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    
    res.status(200).json({
      success: true,
      data: vitals,
      count: vitals.length,
      patientCondition: patient.condition || 'unknown', // Handle undefined condition
      patientName: patient.fullName || `${patient.firstname} ${patient.lastname}`,
      patientId: patientId
    });

  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient vitals' 
    });
  }
});

//  FIX: Update summary route to handle undefined conditions
router.get('/:patientId/summary', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Get patient
    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    let latestVital = null;

    // FIX: Handle undefined condition by checking both collections
    if (!patient.condition || patient.condition === 'undefined') {
      
      
      const [latestHypertension, latestDiabetes] = await Promise.all([
        HypertensionVital.findOne({ 
          $or: [{ userId: patientId }, { patientId: patientId }] 
        }).sort({ createdAt: -1 }),
        Diabetes.findOne({ 
          $or: [{ userId: patientId }, { patientId: patientId }] 
        }).sort({ createdAt: -1 })
      ]);

      // Use the most recent vital from either collection
      latestVital = latestHypertension || latestDiabetes;
      
    } else if (patient.condition === 'hypertension' || patient.condition === 'both') {
      latestVital = await HypertensionVital.findOne({ 
        $or: [{ userId: patientId }, { patientId: patientId }] 
      }).sort({ createdAt: -1 });
    } else if (patient.condition === 'diabetes') {
      latestVital = await Diabetes.findOne({ 
        $or: [{ userId: patientId }, { patientId: patientId }] 
      }).sort({ createdAt: -1 });
    }

    const summary = latestVital ? {
      condition: patient.condition || 'unknown',
      hasData: true,
      timestamp: latestVital.createdAt,
      ...(latestVital.systolic !== undefined ? { systolic: latestVital.systolic } : {}),
      ...(latestVital.diastolic !== undefined ? { diastolic: latestVital.diastolic } : {}),
      ...(latestVital.heartRate !== undefined ? { heartRate: latestVital.heartRate } : {}),
      ...(latestVital.glucose !== undefined ? { glucose: latestVital.glucose } : {})
    } : {
      condition: patient.condition || 'unknown',
      hasData: false
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error(' Error fetching patient vitals summary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient vitals summary' 
    });
  }
});

//  FIX: Update stats route to handle undefined conditions
router.get('/:patientId/stats', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const { days = '30' } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Get patient
    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let stats = {};

    //  FIX: Handle undefined condition by checking both collections
    if (!patient.condition || patient.condition === 'undefined') {
      
      
      const [hypertensionVitals, diabetesVitals] = await Promise.all([
        HypertensionVital.find({
          $or: [{ userId: patientId }, { patientId: patientId }],
          createdAt: { $gte: daysAgo }
        }),
        Diabetes.find({
          $or: [{ userId: patientId }, { patientId: patientId }],
          createdAt: { $gte: daysAgo }
        })
      ]);

      const allVitals = [...hypertensionVitals, ...diabetesVitals];
      
      stats = {
        condition: 'unknown',
        count: allVitals.length,
        avgSystolic: allVitals.length > 0 ? 
          Math.round(allVitals.reduce((sum, v) => sum + (v.systolic || 0), 0) / allVitals.length) : 0,
        avgDiastolic: allVitals.length > 0 ? 
          Math.round(allVitals.reduce((sum, v) => sum + (v.diastolic || 0), 0) / allVitals.length) : 0,
        avgHeartRate: allVitals.length > 0 ? 
          Math.round(allVitals.reduce((sum, v) => sum + (v.heartRate || 0), 0) / allVitals.length) : 0,
        avgGlucose: allVitals.length > 0 ? 
          Math.round(allVitals.reduce((sum, v) => sum + (v.glucose || 0), 0) / allVitals.length) : 0
      };

    } else if (patient.condition === 'hypertension' || patient.condition === 'both') {
      const hypertensionVitals = await HypertensionVital.find({
        $or: [{ userId: patientId }, { patientId: patientId }],
        createdAt: { $gte: daysAgo }
      });

      stats = {
        condition: 'hypertension',
        count: hypertensionVitals.length,
        avgSystolic: hypertensionVitals.length > 0 ? 
          Math.round(hypertensionVitals.reduce((sum, v) => sum + v.systolic, 0) / hypertensionVitals.length) : 0,
        avgDiastolic: hypertensionVitals.length > 0 ? 
          Math.round(hypertensionVitals.reduce((sum, v) => sum + v.diastolic, 0) / hypertensionVitals.length) : 0,
        avgHeartRate: hypertensionVitals.length > 0 ? 
          Math.round(hypertensionVitals.reduce((sum, v) => sum + v.heartRate, 0) / hypertensionVitals.length) : 0
      };

    } else if (patient.condition === 'diabetes') {
      const diabetesVitals = await Diabetes.find({
        $or: [{ userId: patientId }, { patientId: patientId }],
        createdAt: { $gte: daysAgo }
      });

      stats = {
        condition: 'diabetes',
        count: diabetesVitals.length,
        avgGlucose: diabetesVitals.length > 0 ? 
          Math.round(diabetesVitals.reduce((sum, v) => sum + v.glucose, 0) / diabetesVitals.length) : 0,
        avgSystolic: diabetesVitals.length > 0 ? 
          Math.round(diabetesVitals.reduce((sum, v) => sum + v.systolic, 0) / diabetesVitals.length) : 0,
        avgDiastolic: diabetesVitals.length > 0 ? 
          Math.round(diabetesVitals.reduce((sum, v) => sum + v.diastolic, 0) / diabetesVitals.length) : 0,
        avgHeartRate: diabetesVitals.length > 0 ? 
          Math.round(diabetesVitals.reduce((sum, v) => sum + v.heartRate, 0) / diabetesVitals.length) : 0
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
      period: `${days} days`
    });

  } catch (error) {
    console.error('❌ Error fetching patient vitals stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient vitals statistics' 
    });
  }
});

//  ADD: Debug endpoint to check patient data
router.get('/:patientId/debug', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    
    
    
    // Try all possible ways to find patient
    const byUserId = await Patient.findOne({ userId: patientId });
    
    // Check vitals collections
    const hypertensionVitals = await HypertensionVital.find({ 
      $or: [{ userId: patientId }, { patientId: patientId }] 
    });
    
    const diabetesVitals = await Diabetes.find({ 
      $or: [{ userId: patientId }, { patientId: patientId }] 
    });
    
    res.status(200).json({
      patientId: patientId,
      foundByUserId: byUserId ? {
        _id: byUserId._id,
        userId: byUserId.userId,
        condition: byUserId.condition,
        fullName: byUserId.fullName,
        firstname: byUserId.firstname,
        lastname: byUserId.lastname
      } : null,
      hypertensionVitalsCount: hypertensionVitals.length,
      diabetesVitalsCount: diabetesVitals.length,
      allPatientFields: byUserId ? Object.keys(byUserId.toObject()).filter(key => !key.startsWith('_')) : []
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

export default router;