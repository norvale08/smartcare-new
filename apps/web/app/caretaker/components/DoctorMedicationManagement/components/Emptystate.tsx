// FILE: app/caretaker/components/DoctorMedicationManagement/components/EmptyState.tsx

import React from 'react';

interface EmptyStateProps {
  patient?: {
    id: string;
    fullName: string;
  };
  onRefresh: () => void;
  onPrescribeMedication: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  patient,
  onRefresh,
  onPrescribeMedication
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
          />
        </svg>
      </div>
      <h4 className="text-xl font-medium text-gray-900 mb-2">No Medications Found</h4>
      <p className="text-gray-500 mb-6">
        {patient 
          ? `No medications have been prescribed for ${patient.fullName} yet.`
          : 'No patient medications found in the system.'
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Refresh Data
        </button>
        {patient && (
          <button
            onClick={onPrescribeMedication}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Prescribe First Medication
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;