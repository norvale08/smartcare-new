// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/MedicationForm.tsx
// UPDATED: Added edit mode functionality with automatic end date calculation
// ============================================

import React, { useState, useEffect } from 'react';
import ExistingMedications from './ExistingMedicationsList';
import ImageUploadSection from './ImageUploadSection';
import CommonMedications from './CommonMedications';
import AllergySection from './AllergySection';
import SideEffectsSection from './SideEffectsSection';
import ReminderTimes from './ReminderTimes';
import { useMedicationForm } from './hooks';
import type { MedicationFormProps, MedicationFormData } from './types';

// Helper function to calculate end date (same logic as backend)
const calculateEndDate = (startDate: string | undefined, duration: string | undefined): Date | null => {
  // Check if both parameters exist and are not empty strings
  if (!startDate || !duration || startDate.trim() === '' || duration.trim() === '' || duration.toLowerCase().trim() === 'ongoing') {
    return null;
  }

  const start = new Date(startDate);
  
  // Check if date is valid
  if (isNaN(start.getTime())) {
    return null;
  }
  
  const durationLower = duration.toLowerCase();

  // Extract number from duration
  const match = durationLower.match(/(\d+)/);
  if (!match || !match[1]) return null;

  const value = parseInt(match[1], 10);
  if (isNaN(value)) return null;

  if (durationLower.includes('day')) {
    start.setDate(start.getDate() + value);
  } else if (durationLower.includes('week')) {
    start.setDate(start.getDate() + (value * 7));
  } else if (durationLower.includes('month')) {
    start.setMonth(start.getMonth() + value);
  } else if (durationLower.includes('year')) {
    start.setFullYear(start.getFullYear() + value);
  } else {
    return null;
  }

  return start;
};

// Helper function to format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format date for input field (YYYY-MM-DD)
const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MedicationForm: React.FC<MedicationFormProps> = ({
  patient,
  existingMedications,
  loadingMedications,
  onRefreshMedications,
  onPrescribe,
  onCancel,
  editingMedication
}) => {
  const [showCommonMedications, setShowCommonMedications] = useState(false);
  const [medicationImage, setMedicationImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(null);
  const isEditMode = !!editingMedication;

  const {
    formData,
    newAllergy,
    newSideEffect,
    updateFormData,
    setNewAllergy,
    setNewSideEffect,
    addAllergy,
    removeAllergy,
    addSideEffect,
    removeSideEffect,
    toggleReminder,
    resetForm,
    setFormData
  } = useMedicationForm();

  // Populate form with editing medication data
  useEffect(() => {
    if (editingMedication) {
      setFormData({
        medicationName: editingMedication.medicationName || '',
        dosage: editingMedication.dosage || '',
        frequency: editingMedication.frequency || '',
        duration: editingMedication.duration || '',
        instructions: editingMedication.instructions || '',
        startDate: editingMedication.startDate ? formatDateForInput(editingMedication.startDate) : '',
        reminders: editingMedication.reminders || [],
        patientAllergies: editingMedication.patientAllergies || [],
        potentialSideEffects: editingMedication.potentialSideEffects || []
      });
    }
  }, [editingMedication, setFormData]);

  // Calculate end date whenever start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const endDate = calculateEndDate(formData.startDate, formData.duration);
      setCalculatedEndDate(endDate);
    } else {
      setCalculatedEndDate(null);
    }
  }, [formData.startDate, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.medicationName.trim()) {
      alert('Please enter medication name');
      return;
    }

    if (!formData.dosage.trim()) {
      alert('Please enter dosage');
      return;
    }

    if (!formData.frequency) {
      alert('Please select frequency');
      return;
    }

    if (!formData.duration.trim()) {
      alert('Please enter duration');
      return;
    }

    try {
      // Add image preview and calculated end date to form data
      const formDataWithExtras: MedicationFormData & { medicationId?: string } = {
        ...formData,
        endDate: calculatedEndDate?.toISOString() || null
      };

      // Add medication ID if editing
      if (isEditMode && editingMedication) {
        formDataWithExtras.medicationId = editingMedication.id || editingMedication._id;
      }

      // Only add medicationImage if it exists
      if (imagePreview) {
        formDataWithExtras.medicationImage = imagePreview;
      }

      await onPrescribe(formDataWithExtras);
      resetForm();
      setMedicationImage(null);
      setImagePreview(null);
      setImageAnalysis(null);
      setCalculatedEndDate(null);
    } catch (error) {
      // Error is already handled in handlePrescribe
    }
  };

  const handleCancel = () => {
    const message = isEditMode 
      ? 'Are you sure you want to cancel editing? All unsaved changes will be lost.'
      : 'Are you sure you want to cancel? All unsaved changes will be lost.';
      
    if (confirm(message)) {
      onCancel();
      resetForm();
      setMedicationImage(null);
      setImagePreview(null);
      setImageAnalysis(null);
      setCalculatedEndDate(null);
    }
  };

  const selectCommonMedication = (medication: string) => {
    updateFormData('medicationName', medication);
    setShowCommonMedications(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Editing Medication</p>
              <p className="text-xs text-blue-700 mt-0.5">
                You are currently editing <span className="font-medium">{editingMedication?.medicationName}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing Medications - Only show when not in edit mode */}
      {!isEditMode && (
        <ExistingMedications
          medications={existingMedications}
          loading={loadingMedications}
          onRefresh={onRefreshMedications}
        />
      )}

      {/* Image Upload - Only show when not in edit mode */}
      {!isEditMode && (
        <ImageUploadSection
          medicationImage={medicationImage}
          imagePreview={imagePreview}
          imageAnalysis={imageAnalysis}
          analyzingImage={analyzingImage}
          onImageChange={setMedicationImage}
          onPreviewChange={setImagePreview}
          onAnalysisChange={setImageAnalysis}
          onAnalyzingChange={setAnalyzingImage}
          onMedicationNameUpdate={(name) => updateFormData('medicationName', name)}
        />
      )}

      {/* Medication Name with Common Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Medication Name <span className="text-red-500">*</span>
          </label>
          {!isEditMode && (
            <button
              type="button"
              onClick={() => setShowCommonMedications(!showCommonMedications)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showCommonMedications ? 'Hide suggestions' : 'Show common medications'}
            </button>
          )}
        </div>
        
        {showCommonMedications && !isEditMode && (
          <CommonMedications onSelect={selectCommonMedication} />
        )}
        
        <input
          type="text"
          required
          value={formData.medicationName}
          onChange={(e) => updateFormData('medicationName', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
          placeholder="e.g., Lisinopril 10mg"
        />
        
        {/* Duplicate warning - Only show when not editing */}
        {!isEditMode && formData.medicationName && existingMedications.some(
          med => med.medicationName.toLowerCase() === formData.medicationName.toLowerCase() && med.status === 'active'
        ) && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-700">
              ⚠️ This patient already has an active prescription for this medication.
            </p>
          </div>
        )}
      </div>

      {/* Dosage and Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.dosage}
            onChange={(e) => updateFormData('dosage', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1 tablet, 10mg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.frequency}
            onChange={(e) => updateFormData('frequency', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select frequency</option>
            <option value="once daily">Once daily</option>
            <option value="twice daily">Twice daily</option>
            <option value="three times daily">Three times daily</option>
            <option value="four times daily">Four times daily</option>
            <option value="every other day">Every other day</option>
            <option value="weekly">Weekly</option>
            <option value="as needed">As needed</option>
            <option value="with meals">With meals</option>
            <option value="at bedtime">At bedtime</option>
          </select>
        </div>
      </div>

      {/* Start Date and Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isEditMode && (
            <p className="text-xs text-blue-600 mt-1">
              💡 You can update the start date. End date will be recalculated automatically.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.duration}
            onChange={(e) => updateFormData('duration', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 30 days, 3 months, Ongoing"
          />
          <p className="text-xs text-gray-500 mt-1">
            Examples: "30 days", "3 months", "1 year", or "Ongoing"
          </p>
        </div>
      </div>

      {/* Calculated Finish Date Display */}
      {calculatedEndDate && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                {isEditMode ? 'Updated Medication Finish Date' : 'Medication Finish Date'}
              </p>
              <p className="text-lg font-bold text-blue-700">{formatDate(calculatedEndDate)}</p>
              <p className="text-xs text-blue-600 mt-1">
                Based on {formData.duration} from {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'start date'}
              </p>
            </div>
          </div>
        </div>
      )}

      {formData.duration && formData.duration.toLowerCase().trim() === 'ongoing' && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1">Ongoing Medication</p>
              <p className="text-sm text-purple-700">This prescription has no end date and will continue indefinitely</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instructions
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => updateFormData('instructions', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Take with food, Avoid alcohol, Take at bedtime..."
        />
      </div>

      {/* Reminder Times */}
      <ReminderTimes
        reminders={formData.reminders}
        onToggle={toggleReminder}
      />

      {/* Allergies Section */}
      <AllergySection
        newAllergy={newAllergy}
        allergies={formData.patientAllergies}
        onAllergyChange={setNewAllergy}
        onAddAllergy={addAllergy}
        onRemoveAllergy={removeAllergy}
      />

      {/* Side Effects Section */}
      <SideEffectsSection
        newSideEffect={newSideEffect}
        sideEffects={formData.potentialSideEffects}
        onSideEffectChange={setNewSideEffect}
        onAddSideEffect={addSideEffect}
        onRemoveSideEffect={removeSideEffect}
      />

      {/* Submit Buttons */}
      <div className="flex space-x-3 pt-4 border-t sticky bottom-0 bg-white">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditMode ? 'Update Medication' : 'Prescribe Medication'}
        </button>
      </div>
    </form>
  );
};

export default MedicationForm;