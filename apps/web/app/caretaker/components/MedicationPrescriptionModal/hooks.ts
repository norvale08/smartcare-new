// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/hooks.ts
// UPDATED: Added setFormData export for edit mode support
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { MedicationFormData, PatientMedication, Allergy, SideEffect } from './types';

export const useMedicationData = (
  patient: any,
  onPrescribe: (prescription: any) => void,
  onClose: () => void
) => {
  const [existingMedications, setExistingMedications] = useState<PatientMedication[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(false);

  const fetchExistingMedications = useCallback(async () => {
    if (!patient?.id) return;

    try {
      setLoadingMedications(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/patient/${patient.id}`,
        {
          headers: { 
            Authorization: `Bearer ${token ?? ''}`,
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setExistingMedications(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching existing medications:', error);
    } finally {
      setLoadingMedications(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (patient?.id) {
      fetchExistingMedications();
    }
  }, [patient?.id, fetchExistingMedications]);

  const handlePrescribe = useCallback(async (formData: MedicationFormData) => {
    // Check if we're updating or creating
    const isUpdating = !!formData.medicationId;

    if (!isUpdating) {
      // Check for duplicate medication only when creating new
      const isDuplicate = existingMedications.some(
        med => med.medicationName.toLowerCase() === formData.medicationName.toLowerCase() &&
               med.status === 'active'
      );

      if (isDuplicate) {
        if (!confirm('This patient already has an active prescription for this medication. Do you want to prescribe it again?')) {
          return;
        }
      }
    }

    // Prepare prescription data
    const prescriptionData = {
      patientId: patient.id,
      ...formData
    };

    try {
      const token = localStorage.getItem("token");
      
      // Different endpoints for update vs create
      const url = isUpdating
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/prescribe/${formData.medicationId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/prescribe`;
      
      const method = isUpdating ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify(prescriptionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isUpdating ? 'update' : 'prescribe'} medication`);
      }

      const result = await response.json();
      
      // Call the onPrescribe callback
      onPrescribe(result.data);
      
      // Show success message
      alert(`Medication ${isUpdating ? 'updated' : 'prescribed'} successfully!`);
      
      // Refresh existing medications
      fetchExistingMedications();
      
      onClose();
    } catch (error: any) {
      console.error('❌ Error with medication:', error);
      alert(error.message || `Failed to ${isUpdating ? 'update' : 'prescribe'} medication. Please try again.`);
      throw error;
    }
  }, [existingMedications, patient?.id, onPrescribe, onClose, fetchExistingMedications]);

  return {
    existingMedications,
    loadingMedications,
    fetchExistingMedications,
    handlePrescribe
  };
};

export const useMedicationForm = () => {
  const [formData, setFormData] = useState<MedicationFormData>({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0] || '',
    reminders: [],
    patientAllergies: [],
    potentialSideEffects: []
  });

  const [newAllergy, setNewAllergy] = useState<Allergy>({
    allergyName: '',
    severity: 'mild',
    reaction: '',
    notes: ''
  });

  const [newSideEffect, setNewSideEffect] = useState<SideEffect>({
    name: '',
    severity: 'common',
    description: ''
  });

  const updateFormData = (field: keyof MedicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAllergy = () => {
    if (!newAllergy.allergyName.trim() || !newAllergy.reaction.trim()) {
      alert('Please fill in allergy name and reaction');
      return;
    }

    const isDuplicate = formData.patientAllergies.some(
      allergy => allergy.allergyName.toLowerCase() === newAllergy.allergyName.toLowerCase()
    );

    if (isDuplicate) {
      alert('This allergy has already been added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      patientAllergies: [...prev.patientAllergies, { ...newAllergy }]
    }));

    setNewAllergy({ 
      allergyName: '', 
      severity: 'mild', 
      reaction: '', 
      notes: '' 
    });
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      patientAllergies: prev.patientAllergies.filter((_, i) => i !== index)
    }));
  };

  const addSideEffect = () => {
    if (!newSideEffect.name.trim()) {
      alert('Please enter side effect name');
      return;
    }

    const isDuplicate = formData.potentialSideEffects.some(
      effect => effect.name.toLowerCase() === newSideEffect.name.toLowerCase()
    );

    if (isDuplicate) {
      alert('This side effect has already been added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      potentialSideEffects: [...prev.potentialSideEffects, { ...newSideEffect }]
    }));

    setNewSideEffect({ 
      name: '', 
      severity: 'common', 
      description: '' 
    });
  };

  const removeSideEffect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      potentialSideEffects: prev.potentialSideEffects.filter((_, i) => i !== index)
    }));
  };

  const toggleReminder = (time: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.includes(time)
        ? prev.reminders.filter(t => t !== time)
        : [...prev.reminders, time]
    }));
  };

  const resetForm = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      startDate: new Date().toISOString().split('T')[0] || '',
      reminders: [],
      patientAllergies: [],
      potentialSideEffects: []
    });
    setNewAllergy({ allergyName: '', severity: 'mild', reaction: '', notes: '' });
    setNewSideEffect({ name: '', severity: 'common', description: '' });
  };

  return {
    formData,
    setFormData, // ⭐ ADDED: Export setFormData for edit mode
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
  };
};