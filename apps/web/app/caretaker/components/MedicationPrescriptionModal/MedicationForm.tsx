// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/MedicationForm.tsx
// ============================================

import React, { useState } from 'react';
import ExistingMedications from './ExistingMedicationsList';
import ImageUploadSection from './ImageUploadSection';
import CommonMedications from './CommonMedications';
import AllergySection from './AllergySection';
import SideEffectsSection from './SideEffectsSection';
import ReminderTimes from './ReminderTimes';
import { useMedicationForm } from './hooks';
import type { MedicationFormProps } from './types';

const MedicationForm: React.FC<MedicationFormProps> = ({
  patient,
  existingMedications,
  loadingMedications,
  onRefreshMedications,
  onPrescribe,
  onCancel
}) => {
  const [showCommonMedications, setShowCommonMedications] = useState(false);
  const [medicationImage, setMedicationImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

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
    resetForm
  } = useMedicationForm();

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
      // Add image preview to form data if exists
      const formDataWithImage = {
        ...formData,
        medicationImage: imagePreview || undefined
      };

      await onPrescribe(formDataWithImage);
      resetForm();
      setMedicationImage(null);
      setImagePreview(null);
      setImageAnalysis(null);
    } catch (error) {
      // Error is already handled in handlePrescribe
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      onCancel();
      resetForm();
      setMedicationImage(null);
      setImagePreview(null);
      setImageAnalysis(null);
    }
  };

  const selectCommonMedication = (medication: string) => {
    updateFormData('medicationName', medication);
    setShowCommonMedications(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Existing Medications */}
      <ExistingMedications
        medications={existingMedications}
        loading={loadingMedications}
        onRefresh={onRefreshMedications}
      />

      {/* Image Upload */}
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

      {/* Medication Name with Common Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Medication Name <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCommonMedications(!showCommonMedications)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showCommonMedications ? 'Hide suggestions' : 'Show common medications'}
          </button>
        </div>
        
        {showCommonMedications && (
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
        
        {/* Duplicate warning */}
        {formData.medicationName && existingMedications.some(
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

      {/* Duration */}
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
      </div>

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
          Prescribe Medication
        </button>
      </div>
    </form>
  );
};

export default MedicationForm;