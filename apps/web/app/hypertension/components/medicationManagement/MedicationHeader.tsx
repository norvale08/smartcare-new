// FILE: apps/web/app/patient/components/MedicationHeader.tsx
import React from 'react';
import { Pill } from 'lucide-react';

interface MedicationHeaderProps {
  medication: any;
  isEnglish: () => boolean;
}

const MedicationHeader: React.FC<MedicationHeaderProps> = ({ medication, isEnglish }) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <Pill className="w-5 h-5 text-blue-600" />
      <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
        {isEnglish() ? 'Active' : 'Inatumika'}
      </span>
      {medication.lastTaken && (
        <span className="text-xs text-green-600">
          {isEnglish() ? 'Last taken:' : 'Ilinyonywa:'} {new Date(medication.lastTaken).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      )}
    </div>
  );
};

export default MedicationHeader;