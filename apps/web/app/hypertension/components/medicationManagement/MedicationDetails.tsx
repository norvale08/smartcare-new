// FILE: apps/web/app/patient/components/MedicationDetails.tsx
import React from 'react';

interface MedicationDetailsProps {
  medication: any;
  isEnglish: () => boolean;
}

const MedicationDetails: React.FC<MedicationDetailsProps> = ({ medication, isEnglish }) => {
  return (
    <div className="text-sm text-gray-600 space-y-1">
      <p><strong>{isEnglish() ? 'Dosage:' : 'Kipimo:'}</strong> {medication.dosage}</p>
      <p><strong>{isEnglish() ? 'Frequency:' : 'Mara ngapi:'}</strong> {medication.frequency}</p>
      {medication.instructions && (
        <p><strong>{isEnglish() ? 'Instructions:' : 'Maelekezo:'}</strong> {medication.instructions}</p>
      )}
    </div>
  );
};

export default MedicationDetails;