// apps/api/src/routes/medicationReminders/controllers/doctorController.ts
import { MedicationModel } from "../../../models/medicationModels";
import { connectMongoDB } from "../../../lib/mongodb";;
import { mapToObject } from "../helpers";

export const getDoctorPatientMedications = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;

    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const medications = await MedicationModel.find({
      patientId: patientId,
      prescribedBy: req.userId
    })
    .populate('patientId', 'fullName email phone')
    .populate('prescribedBy', 'fullName specialization')
    .sort({ status: 1, medicationName: 1 });

    const formattedMedications = medications.map((med, index) => ({
      _id: med._id,
      medicationName: med.medicationName,
      dosage: med.dosage,
      frequency: med.frequency,
      status: med.status,
      startDate: med.startDate,
      lastTaken: med.lastTaken,
      adherence: {
        currentStatus: med.adherence?.currentStatus,
        reasonForStopping: med.adherence?.reasonForStopping,
        stoppedAt: med.adherence?.stoppedAt,
        history: med.adherence?.history || []
      },
      experiencedSideEffects: (med.experiencedSideEffects || []).map((effect: any, effectIndex: number) => ({
        ...(effect.toObject ? effect.toObject() : effect),
        effectId: effectIndex, // Add index as ID for reference
        hasDoctorNotes: !!effect.doctorNotes,
        resolved: effect.resolved || false
      })),
      weeklyAdherence: mapToObject(med.weeklyAdherence),
      takenHistoryCount: med.takenHistory?.length || 0,
      patientAllergies: med.patientAllergies || [],
      potentialSideEffects: med.potentialSideEffects || [],
      patient: med.patientId,
      prescribedBy: med.prescribedBy,
      // Add summary for doctor
      summary: {
        totalSideEffects: (med.experiencedSideEffects || []).length,
        severeSideEffects: (med.experiencedSideEffects || []).filter((e: any) => 
          e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
        ).length,
        unresolvedSideEffects: (med.experiencedSideEffects || []).filter((e: any) => !e.resolved).length
      }
    }));

    // Calculate overall patient summary
    const overallSummary = {
      totalMedications: medications.length,
      active: medications.filter(m => m.status === 'active').length,
      stopped: medications.filter(m => m.status === 'stopped').length,
      completed: medications.filter(m => m.status === 'completed').length,
      totalSideEffects: medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
      severeSideEffects: medications.reduce((sum, m) => sum + 
        (m.experiencedSideEffects?.filter((e: any) => 
          e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
        ).length || 0), 0),
      recentStopped: medications
        .filter(m => m.status === 'stopped')
        .sort((a: any, b: any) => 
          new Date(b.adherence?.stoppedAt || 0).getTime() - new Date(a.adherence?.stoppedAt || 0).getTime()
        )
        .slice(0, 5)
        .map((med: any) => ({
          medicationName: med.medicationName,
          stoppedAt: med.adherence?.stoppedAt,
          reason: med.adherence?.reasonForStopping
        }))
    };

    res.json({
      success: true,
      data: {
        medications: formattedMedications,
        summary: overallSummary,
        patient: medications[0]?.patientId || null
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching medications for doctor view:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient medications",
      error: error.message
    });
  }
};

export const getStoppedMedicationsSummary = async (req: any, res: any) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const stoppedMedications = await MedicationModel.find({
      prescribedBy: req.userId,
      status: 'stopped'
    })
    .populate('patientId', 'fullName email')
    .sort({ 'adherence.stoppedAt': -1 })
    .select('medicationName dosage patientId adherence experiencedSideEffects');

    const reasonsSummary: {[key: string]: number} = {};
    const sideEffectsByReason: {[key: string]: any[]} = {};

    stoppedMedications.forEach(med => {
      const reason = med.adherence?.reasonForStopping || 'Unknown';
      reasonsSummary[reason] = (reasonsSummary[reason] || 0) + 1;
      
      if (med.experiencedSideEffects && med.experiencedSideEffects.length > 0) {
        if (!sideEffectsByReason[reason]) {
          sideEffectsByReason[reason] = [];
        }
        sideEffectsByReason[reason].push(...med.experiencedSideEffects);
      }
    });

    const medicationsWithDetails = stoppedMedications.map(med => ({
      medicationName: med.medicationName,
      dosage: med.dosage,
      patient: med.patientId,
      reason: med.adherence?.reasonForStopping,
      stoppedAt: med.adherence?.stoppedAt,
      sideEffects: med.experiencedSideEffects?.map((se: any) => ({
        name: se.sideEffectName,
        severity: se.severity,
        intensity: se.intensity,
        notes: se.notes,
        reportedAt: se.reportedAt,
        resolved: se.resolved
      })) || [],
      totalSideEffects: med.experiencedSideEffects?.length || 0
    }));

    res.json({
      success: true,
      data: {
        totalStopped: stoppedMedications.length,
        medications: medicationsWithDetails,
        reasonsSummary,
        sideEffectsByReason,
        recentStops: stoppedMedications.slice(0, 10)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching stopped medications summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stopped medications summary",
      error: error.message
    });
  }
};
export const getExpiringMedications = async (req: any, res: any) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find medications expiring soon
    const expiringMedications = await MedicationModel.find({
      prescribedBy: req.userId,
      status: 'active',
      endDate: { 
        $exists: true,
        $ne: null,
        $lte: sevenDaysFromNow 
      }
    })
    .populate('patientId', 'fullName email phone')
    .sort({ endDate: 1 });

    const categorized = {
      expired: expiringMedications.filter(med => med.endDate && med.endDate < today),
      expiringToday: expiringMedications.filter(med => {
        if (!med.endDate) return false;
        const endDate = new Date(med.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === today.getTime();
      }),
      expiringIn3Days: expiringMedications.filter(med => {
        if (!med.endDate) return false;
        return med.endDate > today && med.endDate <= threeDaysFromNow;
      }),
      expiringIn7Days: expiringMedications.filter(med => {
        if (!med.endDate) return false;
        return med.endDate > threeDaysFromNow && med.endDate <= sevenDaysFromNow;
      })
    };

    // Mark alerts as sent for medications expiring in 3 days
    const alertIds = categorized.expiringIn3Days
      .filter(med => !med.expiryAlert?.sent)
      .map(med => med._id);

    if (alertIds.length > 0) {
      await MedicationModel.updateMany(
        { _id: { $in: alertIds } },
        { 
          $set: { 
            'expiryAlert.sent': true,
            'expiryAlert.sentAt': new Date()
          }
        }
      );
    }

    const formattedMedications = expiringMedications.map(med => {
      const daysUntilExpiry = med.endDate 
        ? Math.ceil((med.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        _id: med._id,
        medicationName: med.medicationName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        startDate: med.startDate,
        endDate: med.endDate,
        daysUntilExpiry,
        patient: med.patientId,
        status: med.status,
        alertSent: med.expiryAlert?.sent || false
      };
    });

    res.json({
      success: true,
      data: {
        medications: formattedMedications,
        categorized: {
          expired: categorized.expired.length,
          expiringToday: categorized.expiringToday.length,
          expiringIn3Days: categorized.expiringIn3Days.length,
          expiringIn7Days: categorized.expiringIn7Days.length
        },
        totalExpiring: expiringMedications.length,
        newAlerts: alertIds.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching expiring medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring medications",
      error: error.message
    });
  }
};
export const getSideEffectsDoctorSummary = async (req: any, res: any) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor role required."
      });
    }

    await connectMongoDB();

    const medications = await MedicationModel.find({
      prescribedBy: req.userId,
      'experiencedSideEffects.0': { $exists: true }
    })
    .populate('patientId', 'fullName email')
    .select('medicationName patientId experiencedSideEffects status');

    const allSideEffects: any[] = [];
    medications.forEach(med => {
      if (med.experiencedSideEffects && med.experiencedSideEffects.length > 0) {
        med.experiencedSideEffects.forEach((effect: any, index: number) => {
          allSideEffects.push({
            ...(effect.toObject ? effect.toObject() : effect),
            medicationId: med._id,
            medicationName: med.medicationName,
            patient: med.patientId,
            patientId: med.patientId?._id,
            status: med.status,
            effectIndex: index
          });
        });
      }
    });

    // Group by severity
    const bySeverity = {
      severe: allSideEffects.filter(se => 
        se.severity === 'severe' || se.intensity === 'severe' || se.intensity === 'very severe'
      ),
      moderate: allSideEffects.filter(se => 
        se.severity === 'moderate' || se.intensity === 'moderate'
      ),
      mild: allSideEffects.filter(se => 
        se.severity === 'mild' || se.intensity === 'mild'
      )
    };

    // Group by medication
    const byMedication: {[key: string]: any[]} = {};
    allSideEffects.forEach(se => {
      const key = se.medicationName;
      if (!byMedication[key]) {
        byMedication[key] = [];
      }
      byMedication[key].push(se);
    });

    // Unresolved side effects
    const unresolved = allSideEffects.filter(se => !se.resolved);

    res.json({
      success: true,
      data: {
        totalSideEffects: allSideEffects.length,
        totalPatients: [...new Set(allSideEffects.map(se => se.patientId))].length,
        totalMedications: medications.length,
        bySeverity,
        byMedication,
        unresolvedCount: unresolved.length,
        unresolved,
        recentSideEffects: allSideEffects
          .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
          .slice(0, 20)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching side effects doctor summary:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch side effects summary",
      error: error.message
    });
  }
};