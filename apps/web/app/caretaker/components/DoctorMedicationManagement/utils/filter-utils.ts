// FILE: app/caretaker/components/DoctorMedicationManagement/utils/filter-utils.ts

import { Medication, PatientInfo } from '../../types/medication-types';

/**
 * Get patient name from PatientInfo or string ID
 */
const getPatientName = (
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
 * Filter medications based on search term, status, and severity
 */
export const filterMedications = (
  medications: Medication[],
  searchTerm: string,
  filterStatus: 'all' | 'active' | 'stopped' | 'completed',
  filterSeverity: 'all' | 'mild' | 'moderate' | 'severe',
  patient?: { id: string; fullName: string }
): Medication[] => {
  return medications.filter(medication => {
    // Convert search term to lowercase for case-insensitive comparison
    const searchLower = searchTerm.toLowerCase();
    
    // Check search term
    const matchesSearch = searchTerm === '' || 
      medication.medicationName.toLowerCase().includes(searchLower) ||
      getPatientName(medication.patientId, patient).toLowerCase().includes(searchLower);
    
    // Check status filter
    const matchesStatus = filterStatus === 'all' || medication.status === filterStatus;
    
    // Check severity filter
    const matchesSeverity = filterSeverity === 'all' || 
      (medication.experiencedSideEffects && 
       medication.experiencedSideEffects.some(se => {
         return se.severity === filterSeverity || 
                (se.intensity && se.intensity === filterSeverity);
       }));
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });
};

/**
 * Check if any filters are currently active
 */
export const hasActiveFilters = (
  searchTerm: string,
  filterStatus: 'all' | 'active' | 'stopped' | 'completed',
  filterSeverity: 'all' | 'mild' | 'moderate' | 'severe'
): boolean => {
  return !!(searchTerm || filterStatus !== 'all' || filterSeverity !== 'all');
};