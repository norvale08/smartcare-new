// FILE: apps/web/app/patient/components/ActiveMedicationCard.tsx
import React, { useState } from 'react';
import { 
  Pill, 
  CheckCircle, 
  XCircle, 
  Pause, 
  AlertTriangle,
  Info,
  MessageSquare,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import SideEffectsSection from './SideEffectsSection';
import MissMedicationDialog from './MissMedicationDialog';
import StopMedicationDialog from './StopMedicationDialog';
import { Medication } from '../../types/medication-types';

interface ActiveMedicationCardProps {
  medication: Medication;
  isEnglish: () => boolean;
  onMarkAsTaken: (medicationId: string) => void;
  onMarkAsMissed: (medicationId: string, reason: string) => void;
  onStopMedication: (medicationId: string, reason: string, notes?: string) => void;
  onReportSideEffect: (medicationId: string, data: any) => void;
}

const ActiveMedicationCard: React.FC<ActiveMedicationCardProps> = ({
  medication,
  isEnglish,
  onMarkAsTaken,
  onMarkAsMissed,
  onStopMedication,
  onReportSideEffect
}) => {
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [showReportSideEffect, setShowReportSideEffect] = useState(false);
  const [showMissDialog, setShowMissDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [newSideEffect, setNewSideEffect] = useState({
    name: '',
    severity: 'mild' as const,
    notes: '',
    intensity: 'moderate' as const
  });

  const toggleSideEffect = (effectName: string) => {
    setSelectedSideEffects(prev => 
      prev.includes(effectName) 
        ? prev.filter(name => name !== effectName)
        : [...prev, effectName]
    );
  };

  const handleReportSideEffect = () => {
    if (!newSideEffect.name.trim()) {
      alert(isEnglish() ? 'Please enter a side effect name' : 'Tafadhali ingiza jina la athari');
      return;
    }

    onReportSideEffect(medication._id, newSideEffect);
    setShowReportSideEffect(false);
    setNewSideEffect({ name: '', severity: 'mild', notes: '', intensity: 'moderate' });
  };

  return (
    <div key={medication._id} className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Medication Header */}
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
          
          {/* Medication Details */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>{isEnglish() ? 'Dosage:' : 'Kipimo:'}</strong> {medication.dosage}</p>
            <p><strong>{isEnglish() ? 'Frequency:' : 'Mara ngapi:'}</strong> {medication.frequency}</p>
            {medication.instructions && (
              <p><strong>{isEnglish() ? 'Instructions:' : 'Maelekezo:'}</strong> {medication.instructions}</p>
            )}
          </div>

          {/* Patient Allergies */}
          {medication.patientAllergies && medication.patientAllergies.length > 0 && (
            <AllergiesSection 
              allergies={medication.patientAllergies}
              isEnglish={isEnglish}
            />
          )}

          {/* Side Effects Section */}
          <SideEffectsSection
            medication={medication}
            showSideEffects={showSideEffects}
            showReportSideEffect={showReportSideEffect}
            selectedSideEffects={selectedSideEffects}
            newSideEffect={newSideEffect}
            onToggleSideEffect={() => setShowSideEffects(!showSideEffects)}
            onToggleReportEffect={() => setShowReportSideEffect(!showReportSideEffect)}
            onToggleSideEffectCheckbox={toggleSideEffect}
            onSideEffectChange={setNewSideEffect}
            onReportSideEffect={handleReportSideEffect}
            onCancelReport={() => {
              setShowReportSideEffect(false);
              setNewSideEffect({ name: '', severity: 'mild', notes: '', intensity: 'moderate' });
            }}
            isEnglish={isEnglish}
          />

          {/* Experienced Side Effects */}
          {medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0 && (
            <ReportedSideEffectsSection
              sideEffects={medication.experiencedSideEffects}
              isEnglish={isEnglish}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onMarkAsTaken(medication._id)}
            className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {isEnglish() ? 'Taken' : 'Imenywewa'}
          </button>
          <button
            onClick={() => setShowMissDialog(true)}
            className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
          >
            <XCircle className="w-4 h-4 mr-1" />
            {isEnglish() ? 'Missed' : 'Imepitwa'}
          </button>
          <button
            onClick={() => setShowStopDialog(true)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
          >
            <Pause className="w-4 h-4 mr-1" />
            {isEnglish() ? 'Stop' : 'Acha'}
          </button>
        </div>
      </div>

      {/* Miss Medication Dialog */}
      {showMissDialog && (
        <MissMedicationDialog
          isOpen={showMissDialog}
          onClose={() => setShowMissDialog(false)}
          onConfirm={(reason) => {
            onMarkAsMissed(medication._id, reason);
            setShowMissDialog(false);
          }}
          isEnglish={isEnglish}
        />
      )}

      {/* Stop Medication Dialog */}
      {showStopDialog && (
        <StopMedicationDialog
          isOpen={showStopDialog}
          onClose={() => setShowStopDialog(false)}
          onConfirm={(reason, notes) => {
            onStopMedication(medication._id, reason, notes);
            setShowStopDialog(false);
          }}
          isEnglish={isEnglish}
        />
      )}
    </div>
  );
};

// Add these missing components or import them
const AllergiesSection: React.FC<{ allergies: any[], isEnglish: () => boolean }> = ({ allergies, isEnglish }) => (
  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-xs font-semibold text-red-700 mb-2 flex items-center">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {isEnglish() ? "Your Allergies:" : "Mzio Wako:"}
    </p>
    <div className="flex flex-wrap gap-2">
      {allergies.map((allergy, index) => {
        const allergyObj = typeof allergy === 'string' ? { allergyName: allergy, severity: 'mild', reaction: '' } : allergy;
        return (
          <div key={index} className="bg-white border border-red-300 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-900">{allergyObj.allergyName}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded $${ allergyObj.severity === 'severe' ? 'bg-red-200 text-red-900' :
                allergyObj.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                'bg-yellow-200 text-yellow-900'
              }`}>
                {allergyObj.severity}
              </span>
            </div>
            {allergyObj.reaction && (
              <p className="text-xs text-red-700 mt-1">{allergyObj.reaction}</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const ReportedSideEffectsSection: React.FC<{ sideEffects: any[], isEnglish: () => boolean }> = ({ sideEffects, isEnglish }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {isEnglish() ? "Reported Side Effects:" : "Athari Zilizoripotiwa:"} ({sideEffects.length})
      </p>
      <div className="space-y-2">
        {sideEffects.map((effect, index) => (
          <div key={index} className="bg-white border border-orange-300 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{effect.sideEffectName}</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.severity)}`}>
                  {effect.severity}
                </span>
                {effect.intensity && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.intensity)}`}>
                    {effect.intensity}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(effect.reportedAt).toLocaleDateString()}
              </span>
            </div>
          
            {effect.notes && (
              <p className="text-xs text-gray-600 mt-1">{effect.notes}</p>
            )}
          
            {/* Doctor Information */}
            {effect.doctorNotes && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">
                    {isEnglish() ? 'Doctor Notes:' : 'Maelezo ya Daktari:'}
                  </span>
                </div>
                <p className="text-xs text-blue-700">{effect.doctorNotes}</p>
                {effect.resolved && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      {isEnglish() ? 'Resolved' : 'Imetatuliwa'}
                    </span>
                    {effect.resolvedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(effect.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveMedicationCard;