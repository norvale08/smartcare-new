// FILE: app/caretaker/components/DoctorMedicationManagement/utils/medication-utils.ts

import { PatientInfo, DoctorInfo, Medication, MedicationForForm, SideEffect } from '../../types/medication-types';

/**
 * Get patient name from PatientInfo or string ID
 */
export const getPatientName = (
  patientId: string | PatientInfo,
  fallbackPatient?: { id: string; fullName: string }
): string => {
  if (typeof patientId === 'string') {
    if (fallbackPatient && fallbackPatient.id === patientId) {
      return fallbackPatient.fullName;
    }
    return 'Unknown Patient';
  }
  return patientId.fullName || 'Unknown Patient';
};

/**
 * Get patient ID from PatientInfo or string
 */
export const getPatientId = (patientId: string | PatientInfo): string => {
  if (typeof patientId === 'string') {
    return patientId;
  }
  return patientId._id;
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Convert Medication to MedicationForForm for editing
 */
export const convertForForm = (medication: Medication): MedicationForForm => {
  return {
    _id: medication._id,
    id: medication.id,
    medicationName: medication.medicationName,
    dosage: medication.dosage,
    frequency: medication.frequency,
    duration: medication.duration,
    instructions: medication.instructions,
    reminders: medication.reminders || [],
    status: medication.status,
    startDate: medication.startDate,
    patientAllergies: medication.patientAllergies || [],
    potentialSideEffects: medication.potentialSideEffects || [],
    patientId: typeof medication.patientId === 'string' 
      ? medication.patientId 
      : medication.patientId._id,
    prescribedBy: typeof medication.prescribedBy === 'string'
      ? medication.prescribedBy
      : (medication.prescribedBy as DoctorInfo)._id,
    createdAt: medication.createdAt,
    lastTaken: medication.lastTaken,
    adherence: medication.adherence,
    experiencedSideEffects: medication.experiencedSideEffects,
    summary: medication.summary
  };
};