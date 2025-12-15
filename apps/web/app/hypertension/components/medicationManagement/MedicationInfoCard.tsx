// FILE: apps/web/app/patient/components/MedicationInfoCard.tsx
import React from 'react';
import { FileText, Pause } from 'lucide-react';

interface MedicationInfoCardProps {
  medication: any;
  isEnglish: () => boolean;
}

const MedicationInfoCard: React.FC<MedicationInfoCardProps> = ({ medication, isEnglish }) => {
  const isActive = medication.status === 'active';

  return (
    <div className="min-w-[180px]">
      {/* Medication name and dosage - only show once */}
      <div className="font-medium text-gray-900">{medication.medicationName}</div>
      <div className="text-sm text-gray-600">{medication.dosage}</div>
      <div className="text-xs text-gray-500">{medication.frequency}</div>
      
      {/* Prescribed by information - if available */}
      {medication.prescribedBy && (
        <div className="text-xs text-blue-600 mt-1">
          <FileText className="inline-block w-3 h-3 mr-1" />
          {isEnglish() ? 'Prescribed by: ' : 'Imeagizwa na: '}
          {medication.prescribedBy.fullName || 'Doctor'}
        </div>
      )}
      
      {/* Display allergies - compact view */}
      {medication.patientAllergies && medication.patientAllergies.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {medication.patientAllergies.slice(0, 2).map((allergy: any, index: number) => {
              const allergyName = typeof allergy === 'string' ? allergy : allergy.allergyName;
              return (
                <span
                  key={index}
                  className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200"
                  title={isEnglish() ? `Allergy: ${allergyName}` : `Mzio: ${allergyName}`}
                >
                  {allergyName}
                </span>
              );
            })}
            {medication.patientAllergies.length > 2 && (
              <span className="text-xs text-red-600" title={isEnglish() 
                ? `${medication.patientAllergies.length - 2} more allergies` 
                : `Mizio ${medication.patientAllergies.length - 2} zaidi`}>
                +{medication.patientAllergies.length - 2}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Status indicator for stopped medications */}
      {!isActive && (
        <div className="text-xs text-red-600 mt-1 font-medium flex items-center">
          <Pause className="w-3 h-3 mr-1" />
          {isEnglish() ? 'Stopped' : 'Imeachwa'}
        </div>
      )}
    </div>
  );
};

export default MedicationInfoCard;