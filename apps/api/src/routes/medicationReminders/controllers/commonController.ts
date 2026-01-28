// apps/api/src/routes/medicationReminders/controllers/commonController.ts
import { MedicationModel } from "../../../models/medicationModels";
import { connectMongoDB } from "../../../lib/mongodb";
import { mapToObject } from "../helpers";

export const restartMedication = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason } = req.body;

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId,
      status: 'stopped'
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Stopped medication not found or you don't have permission to access it"
      });
    }

    medication.status = 'active';
    
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'taken',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'taken';
      medication.adherence.reasonForStopping = undefined;
      medication.adherence.stoppedAt = undefined;
    }

    // Clear future weekly adherence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (medication.weeklyAdherence) {
      medication.weeklyAdherence.forEach((value: any, key: string) => {
        const date = new Date(key);
        if (date >= today) {
          medication.weeklyAdherence.delete(key);
        }
      });
    }

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'taken',
      reason: reason || 'Restarted medication'
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication restarted successfully",
      data: medication
    });

  } catch (error: any) {
    console.error(' Error restarting medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to restart medication",
      error: error.message
    });
  }
};

export const getTodayMedications = async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const todayMedications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ medicationName: 1 });

    res.json({
      success: true,
      data: todayMedications,
      count: todayMedications.length
    });

  } catch (error: any) {
    console.error(' Error fetching today medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's medications",
      error: error.message
    });
  }
};

export const getAdherenceSummary = async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName status adherence lastTaken takenHistory experiencedSideEffects');

    let totalMedications = medications.length;
    let activeMedications = medications.filter(m => m.status === 'active').length;
    let stoppedMedications = medications.filter(m => m.status === 'stopped').length;
    
    let adherenceRate = 0;
    if (activeMedications > 0) {
      const takenCount = medications.filter(m => 
        m.status === 'active' && 
        m.adherence?.currentStatus === 'taken'
      ).length;
      adherenceRate = Math.round((takenCount / activeMedications) * 100);
    }

    // Count side effects
    const totalSideEffects = medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0);
    const severeSideEffects = medications.reduce((sum, m) => sum + 
      (m.experiencedSideEffects?.filter((e: any) => 
        e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
      ).length || 0), 0);

    const recentlyStopped = medications
      .filter(m => m.status === 'stopped')
      .sort((a: any, b: any) => new Date(b.adherence?.stoppedAt || 0).getTime() - new Date(a.adherence?.stoppedAt || 0).getTime())
      .slice(0, 5)
      .map((med: any) => ({
        medicationName: med.medicationName,
        stoppedAt: med.adherence?.stoppedAt,
        reason: med.adherence?.reasonForStopping,
        sideEffectsCount: med.experiencedSideEffects?.length || 0
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalMedications,
          activeMedications,
          stoppedMedications,
          adherenceRate,
          totalSideEffects,
          severeSideEffects
        },
        recentlyStopped,
        medications: medications.map((med: any) => ({
          medicationName: med.medicationName,
          status: med.status,
          adherence: med.adherence?.currentStatus || 'unknown',
          lastTaken: med.lastTaken,
          takenCount: med.takenHistory?.length || 0,
          stoppedReason: med.adherence?.reasonForStopping,
          sideEffectsCount: med.experiencedSideEffects?.length || 0,
          severeSideEffectsCount: med.experiencedSideEffects?.filter((e: any) => 
            e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
          ).length || 0
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching adherence summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adherence summary",
      error: error.message
    });
  }
};

export const getDueMedications = async (req: any, res: any) => {
  try {
    const currentTime = new Date();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);

    await connectMongoDB();

    const dueMedications = await MedicationModel.find({
      patientId: req.userId,
      status: 'active',
      reminders: { $in: [currentTimeStr] }
    })
    .populate('prescribedBy', 'fullName specialization');

    res.json({
      success: true,
      data: dueMedications,
      count: dueMedications.length,
      currentTime: currentTimeStr
    });

  } catch (error: any) {
    console.error(' Error fetching due medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due medications",
      error: error.message
    });
  }
};

export const getMedicationById = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    res.json({
      success: true,
      data: medication
    });

  } catch (error: any) {
    console.error(' Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication",
      error: error.message
    });
  }
};

export const getMedicationHistory = async (req: any, res: any) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    await connectMongoDB();

    const query: any = {
      patientId: req.userId,
      lastTaken: { $exists: true }
    };

    if (startDate || endDate) {
      query.lastTaken = {};
      if (startDate) query.lastTaken.$gte = new Date(startDate as string);
      if (endDate) query.lastTaken.$lte = new Date(endDate as string);
    }

    const medications = await MedicationModel.find(query)
      .populate('prescribedBy', 'fullName specialization')
      .sort({ lastTaken: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: medications,
      count: medications.length
    });

  } catch (error: any) {
    console.error(' Error fetching medication history:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication history",
      error: error.message
    });
  }
};

export const getSideEffectsSummary = async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: req.userId,
      'experiencedSideEffects.0': { $exists: true }
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName experiencedSideEffects status adherence');

    const sideEffectsSummary = medications.map(med => ({
      medicationName: med.medicationName,
      medicationId: med._id,
      status: med.status,
      stoppedReason: med.adherence?.reasonForStopping,
      sideEffects: (med.experiencedSideEffects || []).map((se: any) => ({
        name: se.sideEffectName,
        severity: se.severity,
        intensity: se.intensity,
        reportedAt: se.reportedAt,
        notes: se.notes,
        resolved: se.resolved || false,
        doctorNotes: se.doctorNotes,
        hasDoctorNotes: !!se.doctorNotes
      }))
    }));

    res.json({
      success: true,
      data: {
        summary: sideEffectsSummary,
        totalMedicationsWithSideEffects: medications.length,
        totalSideEffects: medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
        unresolvedSideEffects: medications.reduce((sum, m) => 
          sum + (m.experiencedSideEffects?.filter((e: any) => !e.resolved).length || 0), 0),
        severeSideEffects: medications.reduce((sum, m) => 
          sum + (m.experiencedSideEffects?.filter((e: any) => 
            e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
          ).length || 0), 0)
      }
    });

  } catch (error: any) {
    console.error(' Error fetching side effects summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects summary",
      error: error.message
    });
  }
};

export const removeSideEffect = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { sideEffectName } = req.body;

    if (!sideEffectName) {
      return res.status(400).json({
        success: false,
        message: "Side effect name is required"
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

    const initialLength = medication.experiencedSideEffects.length;
    medication.experiencedSideEffects = medication.experiencedSideEffects.filter(
      (se: any) => se.sideEffectName.toLowerCase() !== sideEffectName.toLowerCase()
    );

    if (medication.experiencedSideEffects.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Side effect not found in reported list"
      });
    }

    await medication.save();

    res.json({
      success: true,
      message: "Side effect removed successfully",
      data: medication
    });

  } catch (error: any) {
    console.error(' Error removing side effect:', error);
    res.status(500).json({
      success: false,
      message: "Failed to remove side effect",
      error: error.message
    });
  }
};

export const deleteMedication = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;

    await connectMongoDB();

    let medication;
    
    if (req.userRole === 'doctor') {
      // Doctor can delete medications they prescribed
      medication = await MedicationModel.findOne({
        _id: medicationId,
        prescribedBy: req.userId
      });
    } else {
      // Patient can only delete their own medications
      medication = await MedicationModel.findOne({
        _id: medicationId,
        patientId: req.userId
      });
    }

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to delete it"
      });
    }

    await MedicationModel.findByIdAndDelete(medicationId);

    res.json({
      success: true,
      message: "Medication deleted successfully"
    });

  } catch (error: any) {
    console.error(' Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medication",
      error: error.message
    });
  }
};