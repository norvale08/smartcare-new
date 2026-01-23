// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/ExistingMedications.tsx
// ============================================

import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { PatientMedication } from './types';

interface ExistingMedicationsProps {
  medications: PatientMedication[];
  loading: boolean;
  onRefresh: () => void;
}

const ExistingMedications: React.FC<ExistingMedicationsProps> = ({
  medications,
  loading,
  onRefresh
}) => {
  if (medications.length === 0) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-blue-900 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Currently Prescribed Medications ({medications.length})
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-blue-700 hover:text-blue-900 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {medications.map((med, index) => (
          <div 
            key={med._id || index} 
            className={`flex items-center justify-between p-3 rounded ${
              med.status === 'active' ? 'bg-white' : 'bg-gray-50'
            } border ${med.status === 'active' ? 'border-blue-300' : 'border-gray-300'}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  med.status === 'active' ? 'text-blue-900' : 'text-gray-600'
                }`}>
                  {med.medicationName}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  med.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {med.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {med.dosage} • {med.frequency}
              </p>
              {med.startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Started: {formatDate(med.startDate)}
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500 ml-4">
              {med.patientAllergies && med.patientAllergies.length > 0 && (
                <span className="text-red-600">
                  {med.patientAllergies.length} allergy(ies)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingMedications;