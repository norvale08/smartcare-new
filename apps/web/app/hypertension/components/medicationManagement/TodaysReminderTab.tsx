// FILE: apps/web/app/patient/components/TodaysRemindersTab.tsx
import React from 'react';
import { Pill } from 'lucide-react';
import ActiveMedicationsList from './ActiveMedicationsList';
import StoppedMedicationsList from './StoppedMedicationList';
import { Medication } from '../../types/medication-types';

interface TodaysRemindersTabProps {
  medications: Medication[];
  isEnglish: () => boolean;
  onRefresh: () => void;
  onMarkAsTaken: (medicationId: string) => void;
  onMarkAsMissed: (medicationId: string, reason: string) => void;
  onStopMedication: (medicationId: string, reason: string, notes?: string) => void;
  onRestartMedication: (medicationId: string) => void;
  onDeleteMedication: (medicationId: string) => void;
  onReportSideEffect: (medicationId: string, data: any) => void;
}

const TodaysRemindersTab: React.FC<TodaysRemindersTabProps> = ({
  medications,
  isEnglish,
  onRefresh,
  onMarkAsTaken,
  onMarkAsMissed,
  onStopMedication,
  onRestartMedication,
  onDeleteMedication,
  onReportSideEffect
}) => {
  const activeMedications = medications.filter(med => med.status === 'active');
  const stoppedMedications = medications.filter(med => med.status === 'stopped');

  if (activeMedications.length === 0 && stoppedMedications.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border">
        <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isEnglish() ? 'No Medications Prescribed' : 'Hakuna Dawa Zilizopendekeza'}
        </h3>
        <p className="text-gray-500">
          {isEnglish() 
            ? "You have no medications prescribed yet. Your medications will appear here once your doctor prescribes them." 
            : "Bado huna dawa zilizopendekeza. Dawa zako zitaonekana hapa baada ya daktari wako kukupendekeza."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Medications */}
      {activeMedications.length > 0 && (
        <ActiveMedicationsList
          medications={activeMedications}
          isEnglish={isEnglish}
          onMarkAsTaken={onMarkAsTaken}
          onMarkAsMissed={onMarkAsMissed}
          onStopMedication={onStopMedication}
          onReportSideEffect={onReportSideEffect}
        />
      )}

      {/* Stopped Medications */}
      {stoppedMedications.length > 0 && (
        <StoppedMedicationsList
          medications={stoppedMedications}
          isEnglish={isEnglish}
          onRestartMedication={onRestartMedication}
          onDeleteMedication={onDeleteMedication}
        />
      )}
    </div>
  );
};

export default TodaysRemindersTab;