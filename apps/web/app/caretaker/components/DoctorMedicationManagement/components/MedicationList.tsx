// FILE: app/caretaker/components/DoctorMedicationManagement/components/MedicationList.tsx

import React from 'react';
import MedicationCard from '../../MedicationCard';
import { Medication, SideEffect } from '../../types/medication-types';

interface MedicationListProps {
  medications: Medication[];
  patient?: {
    id: string;
    fullName: string;
  };
  expandedMedications: { [key: string]: boolean };
  onToggleExpand: (medicationId: string) => void;
  onEdit: (medication: Medication) => void;
  onUpdateStatus: (medicationId: string, newStatus: 'active' | 'completed' | 'stopped' | 'cancelled') => void;
  onDelete: (medicationId: string) => void;
  onOpenSideEffectModal: (sideEffect: SideEffect, medicationId: string, effectIndex: number, medicationName: string) => void;
  getPatientName: (patientId: string | any) => string;
  formatDate: (dateString: string) => string;
}

const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  patient,
  expandedMedications,
  onToggleExpand,
  onEdit,
  onUpdateStatus,
  onDelete,
  onOpenSideEffectModal,
  getPatientName,
  formatDate
}) => {
  return (
    <div className="space-y-4">
      {medications.map(medication => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          patient={patient}
          isExpanded={expandedMedications[medication.id] || false}
          onToggleExpand={() => onToggleExpand(medication.id)}
          onEdit={onEdit}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
          onOpenSideEffectModal={onOpenSideEffectModal}
          getPatientName={getPatientName}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

export default MedicationList;