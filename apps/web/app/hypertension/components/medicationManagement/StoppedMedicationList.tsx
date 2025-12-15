// FILE: apps/web/app/patient/components/StoppedMedicationsList.tsx
import React from 'react';
import { XCircle, PlayCircle, Trash2, AlertTriangle } from 'lucide-react';

interface StoppedMedicationsListProps {
  medications: any[];
  isEnglish: () => boolean;
  onRestartMedication: (medicationId: string) => void;
  onDeleteMedication: (medicationId: string) => void;
}

const StoppedMedicationsList: React.FC<StoppedMedicationsListProps> = ({
  medications,
  isEnglish,
  onRestartMedication,
  onDeleteMedication
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">
        {isEnglish() ? "Stopped Medications" : "Dawa Zilizoachwa"} ({medications.length})
      </h4>
      <div className="space-y-4">
        {medications.map(medication => {
          const stoppedDate = medication.adherence?.stoppedAt 
            ? new Date(medication.adherence.stoppedAt).toLocaleDateString()
            : 'Unknown date';

          return (
            <div key={medication._id} className="p-4 rounded-lg border-2 bg-gray-50 border-gray-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                      {isEnglish() ? "Stopped" : "Imeachwa"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>{isEnglish() ? "Dosage:" : "Kipimo:"}</strong> {medication.dosage}</p>
                    <p><strong>{isEnglish() ? "Frequency:" : "Mara ngapi:"}</strong> {medication.frequency}</p>
                    {medication.adherence?.reasonForStopping && (
                      <p className="text-red-700"><strong>{isEnglish() ? "Reason for stopping:" : "Sababu ya kuacha:"}</strong> {medication.adherence.reasonForStopping}</p>
                    )}
                    <p><strong>{isEnglish() ? "Stopped on:" : "Iliyoachwa:"}</strong> {stoppedDate}</p>
                  </div>

                  {/* Show patient allergies for stopped medication */}
                  {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-medium text-red-600 mb-1">
                        {isEnglish() ? "Patient Allergies:" : "Mzio wa Mgonjwa:"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {medication.patientAllergies.map((allergy: any, index: number) => {
                          const allergyName = typeof allergy === 'string' ? allergy : allergy.allergyName;
                          return (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-white text-red-700 rounded border border-red-200"
                            >
                              {allergyName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show side effects for stopped medication */}
                  {medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0 && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-xs font-medium text-orange-700 mb-1">
                        {isEnglish() ? "Reported Side Effects:" : "Athari Zilizoripotiwa:"} ({medication.experiencedSideEffects.length})
                      </p>
                      <div className="space-y-1">
                        {medication.experiencedSideEffects.map((effect: any, index: number) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">{effect.sideEffectName}</span>
                            <span className={`ml-2 px-1 py-0.5 rounded ${getSeverityColor(effect.severity)}`}>
                              {effect.severity}
                            </span>
                            {effect.notes && (
                              <span className="ml-2 text-gray-600">- {effect.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onRestartMedication(medication._id)}
                    className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    <span>{isEnglish() ? 'Restart' : 'Anzisha Tena'}</span>
                  </button>
                  <button
                    onClick={() => onDeleteMedication(medication._id)}
                    className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span>{isEnglish() ? 'Delete' : 'Futa'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoppedMedicationsList;