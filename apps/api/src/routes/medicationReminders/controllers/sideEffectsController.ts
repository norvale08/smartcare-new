// apps/api/src/routes/medicationReminders/controllers/sideEffectsController.ts
import { MedicationModel } from "../../../models/medicationModels";
import { connectMongoDB } from "../../../lib/mongodb";
import { mapToObject } from "../helpers";
import { SideEffect } from "../interfaces/types";

export const reportSideEffect = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { sideEffectName, severity, notes, intensity } = req.body;

    if (!sideEffectName) {
      return res.status(400).json({
        success: false,
        message: "Side effect name is required"
      });
    }

    if (severity && !['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Severity must be mild, moderate, or severe"
      });
    }

    if (intensity && !['mild', 'moderate', 'severe', 'very severe'].includes(intensity)) {
      return res.status(400).json({
        success: false,
        message: "Intensity must be mild, moderate, severe, or very severe"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    if (!medication.experiencedSideEffects) {
      medication.experiencedSideEffects = [];
    }

    // Check if side effect already exists
    const existingEffectIndex = medication.experiencedSideEffects.findIndex(
      (se: any) => se.sideEffectName.toLowerCase() === sideEffectName.toLowerCase()
    );

    if (existingEffectIndex !== -1) {
      // Update existing side effect
      const existingEffect = medication.experiencedSideEffects[existingEffectIndex];
      medication.experiencedSideEffects[existingEffectIndex] = {
        ...existingEffect.toObject ? existingEffect.toObject() : existingEffect,
        severity: severity || existingEffect.severity,
        notes: notes || existingEffect.notes,
        intensity: intensity || existingEffect.intensity,
        lastUpdated: new Date()
      };
    } else {
      // Add new side effect
      medication.experiencedSideEffects.push({
        sideEffectName,
        reportedAt: new Date(),
        severity: severity || 'mild',
        notes: notes || '',
        intensity: intensity || 'moderate',
        resolved: false,
        lastUpdated: new Date()
      });
    }

    await medication.save();

    if (severity === 'severe') {
      console.log("⚠️ SEVERE SIDE EFFECT REPORTED - Doctor should be notified");
    }

    res.json({
      success: true,
      message: "Side effect reported successfully",
      data: medication.experiencedSideEffects
    });

  } catch (error: any) {
    console.error('❌ Error reporting side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to report side effect",
      error: error.message
    });
  }
};

export const updateSideEffectByDoctor = async (req: any, res: any) => {
  try {
    const { medicationId, effectId } = req.params;
    const { resolved, doctorNotes } = req.body;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      prescribedBy: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you are not the prescribing doctor"
      });
    }

    if (!medication.experiencedSideEffects || medication.experiencedSideEffects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No side effects found for this medication"
      });
    }

    // Find the side effect (using index since effectId is not stored as _id)
    const effectIndex = parseInt(effectId);
    if (isNaN(effectIndex) || effectIndex < 0 || effectIndex >= medication.experiencedSideEffects.length) {
      return res.status(404).json({
        success: false,
        message: "Side effect not found"
      });
    }

    const effect = medication.experiencedSideEffects[effectIndex];
    
    // Update the side effect
    medication.experiencedSideEffects[effectIndex] = {
      ...(effect.toObject ? effect.toObject() : effect),
      resolved: resolved !== undefined ? resolved : effect.resolved,
      doctorNotes: doctorNotes || effect.doctorNotes,
      doctorId: req.userId,
      resolvedAt: resolved ? new Date() : effect.resolvedAt,
      lastUpdated: new Date()
    };

    await medication.save();

    res.json({
      success: true,
      message: "Side effect updated successfully",
      data: medication.experiencedSideEffects[effectIndex]
    });

  } catch (error: any) {
    console.error('❌ Error updating side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update side effect",
      error: error.message
    });
  }
};

export const getSideEffects = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    await connectMongoDB();

    let medication;
    
    if (req.userRole === 'doctor') {
      // Doctor can see all medications they prescribed
      medication = await MedicationModel.findOne({
        _id: medicationId,
        prescribedBy: req.userId
      }).populate('patientId', 'fullName email');
    } else {
      // Patient can only see their own
      medication = await MedicationModel.findOne({
        _id: medicationId,
        patientId: req.userId
      });
    }

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    res.json({
      success: true,
      data: {
        medicationId: medication._id,
        medicationName: medication.medicationName,
        patientId: medication.patientId,
        sideEffects: medication.experiencedSideEffects || []
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching side effects:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects",
      error: error.message
    });
  }
};