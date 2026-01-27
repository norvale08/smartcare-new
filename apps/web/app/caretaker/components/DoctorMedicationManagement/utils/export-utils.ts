// FILE: app/caretaker/components/DoctorMedicationManagement/utils/export-utils.ts

import { Medication, ReportRow, PatientInfo } from '../../types/medication-types';

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
 * Format date string to readable format
 */
const formatDate = (dateString: string): string => {
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
 * Export side effects report as CSV
 */
export const exportSideEffectsReport = (
  medications: Medication[],
  patient?: { id: string; fullName: string }
) => {
  const reportData: ReportRow[] = medications.flatMap(med => 
    (med.experiencedSideEffects || []).map(se => ({
      Patient: getPatientName(med.patientId, patient),
      Medication: med.medicationName,
      'Side Effect': se.sideEffectName,
      Severity: se.severity,
      Intensity: se.intensity || 'N/A',
      'Patient Notes': se.notes || 'N/A',
      'Doctor Notes': se.doctorNotes || 'N/A',
      Resolved: se.resolved ? 'Yes' : 'No',
      'Reported Date': formatDate(se.reportedAt),
      'Last Updated': se.lastUpdated ? formatDate(se.lastUpdated) : 'N/A'
    }))
  );

  if (reportData.length === 0) {
    alert('No side effects data to export');
    return;
  }

  // Get headers from the type definition
  const headers: (keyof ReportRow)[] = [
    'Patient',
    'Medication',
    'Side Effect',
    'Severity',
    'Intensity',
    'Patient Notes',
    'Doctor Notes',
    'Resolved',
    'Reported Date',
    'Last Updated'
  ];

  const csvRows = [
    headers.join(','),
    ...reportData.map(row => 
      headers.map(header => {
        const value = row[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `side-effects-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};