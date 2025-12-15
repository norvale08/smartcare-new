// FILE: apps/web/app/patient/components/MedicationActions.tsx
import React from 'react';
import { XCircle, PlayCircle, Trash2 } from 'lucide-react';

interface MedicationActionsProps {
  medication: any;
  onStopMedication: (medicationId: string) => void;
  onRestartMedication: (medicationId: string) => void;
  onDeleteMedication: (medicationId: string) => void;
  onShowStopDialog: () => void;
  isEnglish: () => boolean;
}

const MedicationActions: React.FC<MedicationActionsProps> = ({
  medication,
  onStopMedication,
  onRestartMedication,
  onDeleteMedication,
  onShowStopDialog,
  isEnglish
}) => {
  const isActive = medication.status === 'active';

  return (
    <div className="flex flex-col space-y-2">
      {isActive ? (
        <button
          onClick={onShowStopDialog}
          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
        >
          <XCircle className="w-4 h-4 mr-1" />
          {isEnglish() ? 'Stop' : 'Acha'}
        </button>
      ) : (
        <>
          <button
            onClick={() => onRestartMedication(medication.medicationId)}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            {isEnglish() ? 'Restart' : 'Anzisha Tena'}
          </button>
          <button
            onClick={() => onDeleteMedication(medication.medicationId)}
            className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {isEnglish() ? 'Delete' : 'Futa'}
          </button>
        </>
      )}
    </div>
  );
};

export default MedicationActions;