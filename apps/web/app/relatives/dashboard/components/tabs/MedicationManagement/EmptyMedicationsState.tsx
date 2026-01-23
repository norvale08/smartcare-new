// relative/dashboard/components/tabs/MedicationManagement/EmptyMedicationsState.tsx
import React from 'react';
import { Pill } from 'lucide-react';

interface EmptyMedicationsStateProps {
  isEnglish: () => boolean;
}

const EmptyMedicationsState: React.FC<EmptyMedicationsStateProps> = ({ isEnglish }) => {
  return (
    <div className="text-center py-8">
      <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isEnglish() ? 'No Medications Found' : 'Hakuna Dawa Zilizopatikana'}
      </h3>
      <p className="text-gray-500">
        {isEnglish() 
          ? "Your patient doesn't have any medications prescribed yet." 
          : "Mgonjwa wako hana dawa zozote zilizopendekeza bado."}
      </p>
    </div>
  );
};

export default EmptyMedicationsState;