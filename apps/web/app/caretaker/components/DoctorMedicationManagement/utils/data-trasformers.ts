// FILE: app/caretaker/components/DoctorMedicationManagement/utils/data-transformers.ts

import { Medication, PatientInfo, DoctorInfo, SideEffect } from '../../types/medication-types';

/**
 * Transform patient view medications from API response
 */
export const transformPatientViewMedications = (
  medicationsData: any[],
  patient?: { id: string; fullName: string }
): Medication[] => {
  const uniqueMedicationsMap = new Map();
  
  medicationsData.forEach((med: any, index: number) => {
    const medId = med._id || med.id || `med-${index}-${Date.now()}`;
    const medName = med.medicationName || 'Unknown Medication';
    
    // Create a unique key to identify duplicates
    const uniqueKey = `${medId}-${medName}`;
    
    // Only add if not already in map (prevents duplicates)
    if (!uniqueMedicationsMap.has(uniqueKey)) {
      // Extract patient information
      let patientId: string | PatientInfo;
      if (med.patientId && typeof med.patientId === 'object') {
        patientId = {
          _id: med.patientId._id || med.patientId.id || patient?.id || 'unknown',
          fullName: med.patientId.fullName || patient?.fullName || 'Unknown Patient',
          email: med.patientId.email,
          phoneNumber: med.patientId.phoneNumber
        };
      } else {
        patientId = patient?.id || 'unknown';
      }

      // Extract doctor information
      let prescribedBy: string | DoctorInfo;
      if (med.prescribedBy && typeof med.prescribedBy === 'object') {
        prescribedBy = {
          _id: med.prescribedBy._id || med.prescribedBy.id || 'unknown',
          fullName: med.prescribedBy.fullName || 'Unknown Doctor',
          specialization: med.prescribedBy.specialization
        };
      } else if (typeof med.prescribedBy === 'string') {
        prescribedBy = med.prescribedBy;
      } else {
        prescribedBy = 'unknown';
      }

      // Extract side effects
      const experiencedSideEffects: SideEffect[] = (med.experiencedSideEffects || []).map((effect: any) => ({
        sideEffectName: effect.sideEffectName || 'Unknown Effect',
        reportedAt: effect.reportedAt || new Date().toISOString(),
        severity: effect.severity || 'mild',
        notes: effect.notes,
        intensity: effect.intensity,
        resolved: effect.resolved || false,
        doctorNotes: effect.doctorNotes,
        resolvedAt: effect.resolvedAt,
        doctorId: effect.doctorId,
        lastUpdated: effect.lastUpdated
      }));

      // Calculate summary
      const totalSideEffects = experiencedSideEffects.length;
      const severeSideEffects = experiencedSideEffects.filter(e => 
        e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
      ).length;
      const unresolvedSideEffects = experiencedSideEffects.filter(e => !e.resolved).length;

      uniqueMedicationsMap.set(uniqueKey, {
        id: medId,
        _id: med._id || med.id,
        medicationName: medName,
        dosage: med.dosage || 'Not specified',
        frequency: med.frequency || 'Not specified',
        duration: med.duration || 'Not specified',
        instructions: med.instructions || '',
        reminders: med.reminders || [],
        status: med.status || 'active',
        startDate: med.startDate || med.createdAt || new Date().toISOString(),
        patientId,
        prescribedBy,
        createdAt: med.createdAt || new Date().toISOString(),
        lastTaken: med.lastTaken,
        adherence: med.adherence || {
          currentStatus: 'taken',
          history: []
        },
        patientAllergies: med.patientAllergies || [],
        potentialSideEffects: med.potentialSideEffects || [],
        experiencedSideEffects,
        summary: {
          totalSideEffects,
          severeSideEffects,
          unresolvedSideEffects
        }
      });
    } else {
      console.log(`⚠️ Duplicate medication skipped: ${medName} (${medId})`);
    }
  });
  
  return Array.from(uniqueMedicationsMap.values());
};

/**
 * Transform summary view medications from API response
 */
export const transformSummaryViewMedications = (allSideEffects: any[]): Medication[] => {
  const medicationsMap = new Map();
  
  allSideEffects.forEach((se: any) => {
    const key = `${se.patientId}_${se.medicationId}`;
    if (!medicationsMap.has(key)) {
      medicationsMap.set(key, {
        id: se.medicationId,
        medicationName: se.medicationName,
        patientId: {
          _id: se.patientId,
          fullName: se.patient?.fullName || 'Unknown Patient',
          email: se.patient?.email
        },
        status: se.status || 'active',
        experiencedSideEffects: []
      });
    }
    // Add side effect to existing medication
    const medication = medicationsMap.get(key);
    medication.experiencedSideEffects.push({
      sideEffectName: se.sideEffectName,
      reportedAt: se.reportedAt,
      severity: se.severity,
      notes: se.notes,
      intensity: se.intensity,
      resolved: se.resolved,
      doctorNotes: se.doctorNotes,
      resolvedAt: se.resolvedAt,
      doctorId: se.doctorId,
      lastUpdated: se.lastUpdated
    });
  });
  
  return Array.from(medicationsMap.values()).map((med: any) => ({
    id: med.id,
    medicationName: med.medicationName,
    patientId: med.patientId,
    status: med.status,
    experiencedSideEffects: med.experiencedSideEffects,
    dosage: 'Not specified',
    frequency: 'Not specified',
    duration: 'Not specified',
    instructions: '',
    reminders: [],
    startDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    prescribedBy: 'unknown',
    adherence: { currentStatus: 'taken', history: [] },
    patientAllergies: [],
    potentialSideEffects: [],
    summary: {
      totalSideEffects: med.experiencedSideEffects.length,
      severeSideEffects: med.experiencedSideEffects.filter((e: any) => 
        e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
      ).length,
      unresolvedSideEffects: med.experiencedSideEffects.filter((e: any) => !e.resolved).length
    }
  }));
};

/**
 * Calculate statistics from medications array
 */
export const calculateMedicationStats = (medications: Medication[]) => {
  return {
    totalMedications: medications.length,
    active: medications.filter(m => m.status === 'active').length,
    stopped: medications.filter(m => m.status === 'stopped').length,
    completed: medications.filter(m => m.status === 'completed').length,
    totalSideEffects: medications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
    severeSideEffects: medications.reduce((sum, m) => sum + 
      (m.experiencedSideEffects?.filter((e: any) => 
        e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
      ).length || 0), 0),
    unresolvedSideEffects: medications.reduce((sum, m) => 
      sum + (m.experiencedSideEffects?.filter((e: any) => !e.resolved).length || 0), 0)
  };
};