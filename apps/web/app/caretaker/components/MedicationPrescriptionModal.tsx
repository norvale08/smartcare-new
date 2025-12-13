// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal.tsx
// ============================================

import React, { useState } from 'react';
import { X, Pill, Calendar, Clock, AlertCircle, Upload, Image as ImageIcon, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface MedicationPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onPrescribe: (prescription: any) => void;
}

interface Allergy {
  allergyName: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes: string;
}

interface SideEffect {
  name: string;
  severity: 'common' | 'uncommon' | 'rare';
  description: string;
}

const MedicationPrescriptionModal: React.FC<MedicationPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPrescribe
}) => {
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    reminders: [] as string[],
    patientAllergies: [] as Allergy[],
    potentialSideEffects: [] as SideEffect[]
  });

  const [medicationImage, setMedicationImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);

  // New allergy form state
  const [newAllergy, setNewAllergy] = useState<Allergy>({
    allergyName: '',
    severity: 'mild',
    reaction: '',
    notes: ''
  });

  // New side effect form state
  const [newSideEffect, setNewSideEffect] = useState<SideEffect>({
    name: '',
    severity: 'common',
    description: ''
  });

  const reminderTimes = ['08:00', '12:00', '18:00', '20:00'];

  // ============================================
  // HANDLER FUNCTIONS
  // ============================================

  const handleToggleReminder = (time: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.includes(time)
        ? prev.reminders.filter(t => t !== time)
        : [...prev.reminders, time]
    }));
  };

  const addAllergy = () => {
    if (!newAllergy.allergyName.trim() || !newAllergy.reaction.trim()) {
      alert('Please fill in allergy name and reaction');
      return;
    }

    // Check for duplicate allergy
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

    // Reset form
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

    // Check for duplicate side effect
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

    // Reset form
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }

      setMedicationImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageAnalysis(null);
    }
  };

  const analyzeMedicationImage = async () => {
    if (!medicationImage) return;

    setAnalyzingImage(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to analyze medication images.");
        setAnalyzingImage(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = (reader.result as string).split(',')[1];

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/analyze-image`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                image: base64Image,
                imageType: medicationImage.type,
              }),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to analyze image');
          }

          const data = await response.json();
          setImageAnalysis(data.analysis || data.message || 'Analysis completed');
          
          // Auto-fill medication name if detected
          if (data.medicationName) {
            setFormData(prev => ({ ...prev, medicationName: data.medicationName }));
          }
        } catch (error) {
          console.error('Error analyzing medication image:', error);
          alert('Failed to analyze medication image. Please try again.');
        } finally {
          setAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(medicationImage);
    } catch (error) {
      console.error('Error reading image file:', error);
      alert('Failed to read image file. Please try again.');
      setAnalyzingImage(false);
    }
  };

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

    // Prepare prescription data
    const prescriptionData = {
      patientId: patient.id,
      medicationName: formData.medicationName,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      instructions: formData.instructions,
      startDate: formData.startDate,
      reminders: formData.reminders,
      patientAllergies: formData.patientAllergies,
      potentialSideEffects: formData.potentialSideEffects,
      medicationImage: medicationImage ? imagePreview : undefined
    };

    console.log('📋 Prescription data being sent:', prescriptionData);
    console.log('🔍 Allergies:', prescriptionData.patientAllergies.length);
    console.log('🔍 Side effects:', prescriptionData.potentialSideEffects.length);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/prescribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify(prescriptionData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to prescribe medication');
      }

      const result = await response.json();
      console.log('✅ Prescription saved:', result);

      // Call the onPrescribe callback if needed (for UI updates)
      onPrescribe(result.data);
      
      // Show success message
      alert('Medication prescribed successfully!');
      
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Error prescribing medication:', error);
      alert(error.message || 'Failed to prescribe medication. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      startDate: new Date().toISOString().split('T')[0],
      reminders: [],
      patientAllergies: [],
      potentialSideEffects: []
    });
    setMedicationImage(null);
    setImagePreview(null);
    setImageAnalysis(null);
    setNewAllergy({ allergyName: '', severity: 'mild', reaction: '', notes: '' });
    setNewSideEffect({ name: '', severity: 'common', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Prescribe Medication</h2>
            <span className="text-sm text-gray-500">for {patient?.name || 'Patient'}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medication Image Upload */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Photo (Optional)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {medicationImage && (
                  <button
                    type="button"
                    onClick={analyzeMedicationImage}
                    disabled={analyzingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {analyzingImage ? 'Analyzing...' : 'Analyze with AI'}
                  </button>
                )}
              </div>
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Medication preview"
                    className="max-w-full h-40 object-contain border border-gray-300 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMedicationImage(null);
                      setImagePreview(null);
                      setImageAnalysis(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {imageAnalysis && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-1">AI Analysis:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{imageAnalysis}</p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Medication Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.medicationName}
                onChange={(e) => setFormData(prev => ({ ...prev, medicationName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lisinopril 10mg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1 tablet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="once daily">Once daily</option>
                  <option value="twice daily">Twice daily</option>
                  <option value="three times daily">Three times daily</option>
                  <option value="four times daily">Four times daily</option>
                  <option value="as needed">As needed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30 days, 3 months, Ongoing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Take with food, Avoid alcohol, Take at bedtime..."
              />
            </div>
          </div>

          {/* Reminder Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Times
            </label>
            <div className="grid grid-cols-4 gap-2">
              {reminderTimes.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleToggleReminder(time)}
                  className={`flex items-center justify-center space-x-2 p-2 rounded-lg border text-sm transition-colors ${
                    formData.reminders.includes(time)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{time}</span>
                </button>
              ))}
            </div>
            {formData.reminders.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {formData.reminders.length} reminder{formData.reminders.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Patient Allergies Section */}
          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              Patient Allergies
            </h3>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newAllergy.allergyName}
                  onChange={(e) => setNewAllergy(prev => ({ ...prev, allergyName: e.target.value }))}
                  placeholder="Allergy name (e.g., Penicillin)"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <select
                  value={newAllergy.severity}
                  onChange={(e) => setNewAllergy(prev => ({ ...prev, severity: e.target.value as 'mild' | 'moderate' | 'severe' }))}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <input
                type="text"
                value={newAllergy.reaction}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, reaction: e.target.value }))}
                placeholder="Reaction (e.g., Rash, difficulty breathing)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                value={newAllergy.notes}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Allergy
              </button>
            </div>

            {formData.patientAllergies.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Added Allergies ({formData.patientAllergies.length}):
                </p>
                {formData.patientAllergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-900">{allergy.allergyName}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          allergy.severity === 'severe' ? 'bg-red-200 text-red-900' :
                          allergy.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {allergy.severity}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{allergy.reaction}</p>
                      {allergy.notes && <p className="text-xs text-red-600 mt-1">{allergy.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                      title="Remove allergy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Potential Side Effects Section */}
          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              Potential Side Effects
            </h3>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newSideEffect.name}
                  onChange={(e) => setNewSideEffect(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Side effect name (e.g., Dizziness)"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={newSideEffect.severity}
                  onChange={(e) => setNewSideEffect(prev => ({ ...prev, severity: e.target.value as 'common' | 'uncommon' | 'rare' }))}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                </select>
              </div>
              <input
                type="text"
                value={newSideEffect.description}
                onChange={(e) => setNewSideEffect(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={addSideEffect}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Side Effect
              </button>
            </div>

            {formData.potentialSideEffects.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Added Side Effects ({formData.potentialSideEffects.length}):
                </p>
                {formData.potentialSideEffects.map((effect, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-orange-200 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-900">{effect.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          effect.severity === 'common' ? 'bg-yellow-200 text-yellow-900' :
                          effect.severity === 'uncommon' ? 'bg-orange-200 text-orange-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          {effect.severity}
                        </span>
                      </div>
                      {effect.description && <p className="text-sm text-orange-700 mt-1">{effect.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSideEffect(index)}
                      className="ml-3 text-orange-600 hover:text-orange-800 transition-colors"
                      title="Remove side effect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                  onClose();
                  resetForm();
                }
              }}
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
      </div>
    </div>
  );
};

export default MedicationPrescriptionModal;