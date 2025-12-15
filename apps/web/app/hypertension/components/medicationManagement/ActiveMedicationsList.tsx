// FILE: apps/web/app/patient/components/ActiveMedicationsList.tsx
import React, { useState } from 'react';
import ActiveMedicationCard from './ActiveMedicationCard';

interface ActiveMedicationsListProps {
  medications: any[];
  isEnglish: () => boolean;
  onMarkAsTaken: (medicationId: string) => void;
  onMarkAsMissed: (medicationId: string, reason: string) => void;
  onStopMedication: (medicationId: string, reason: string, notes?: string) => void;
  onReportSideEffect: (medicationId: string, data: any) => void;
}

const ActiveMedicationsList: React.FC<ActiveMedicationsListProps> = ({
  medications,
  isEnglish,
  onMarkAsTaken,
  onMarkAsMissed,
  onStopMedication,
  onReportSideEffect
}) => {
  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">
        {isEnglish() ? "Active Medications" : "Dawa Zinazotumika"} ({medications.length})
      </h4>
      <div className="space-y-4">
        {medications.map(medication => (
          <ActiveMedicationCard
            key={medication._id}
            medication={medication}
            isEnglish={isEnglish}
            onMarkAsTaken={onMarkAsTaken}
            onMarkAsMissed={onMarkAsMissed}
            onStopMedication={onStopMedication}
            onReportSideEffect={onReportSideEffect}
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveMedicationsList;