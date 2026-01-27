// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/index.tsx
// UPDATED: Added editingMedication support
// ============================================

import React from 'react';
import { X, Pill, Edit } from 'lucide-react';
import { useMedicationData } from './hooks';
import MedicationForm from './MedicationForm';
import type { MedicationPrescriptionModalProps } from './types';

const MedicationPrescriptionModal: React.FC<MedicationPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPrescribe,
  editingMedication // ⭐ ADDED
}) => {
  const {
    existingMedications,
    loadingMedications,
    fetchExistingMedications,
    handlePrescribe
  } = useMedicationData(patient, onPrescribe, onClose);

  if (!isOpen) return null;

  // ⭐ ADDED: Detect if we're in edit mode
  const isEditMode = !!editingMedication;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            {/* ⭐ UPDATED: Show different icon for edit mode */}
            {isEditMode ? (
              <Edit className="w-5 h-5 text-blue-600" />
            ) : (
              <Pill className="w-5 h-5 text-blue-600" />
            )}
            <div>
              {/* ⭐ UPDATED: Different title for edit mode */}
              <h2 className="text-lg font-semibold">
                {isEditMode ? 'Edit Medication' : 'Prescribe Medication'}
              </h2>
              <p className="text-sm text-gray-500">
                for <span className="font-medium">{patient?.name || 'Patient'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <MedicationForm
          patient={patient}
          existingMedications={existingMedications}
          loadingMedications={loadingMedications}
          editingMedication={editingMedication} // ⭐ ADDED: Pass editingMedication
          onRefreshMedications={fetchExistingMedications}
          onPrescribe={handlePrescribe}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default MedicationPrescriptionModal;