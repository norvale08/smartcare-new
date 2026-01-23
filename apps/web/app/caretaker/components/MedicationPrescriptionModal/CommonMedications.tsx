// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/CommonMedications.tsx
// ============================================

import React from 'react';
import { commonMedications } from './constants';

interface CommonMedicationsProps {
  onSelect: (medication: string) => void;
}

const CommonMedications: React.FC<CommonMedicationsProps> = ({ onSelect }) => {
  return (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
      <p className="text-sm font-medium text-gray-700 mb-2">Common Medications:</p>
      <div className="flex flex-wrap gap-2">
        {commonMedications.map((med, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(med.name)}
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            {med.name}
            <span className="text-xs text-gray-500 ml-1">({med.category})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommonMedications;