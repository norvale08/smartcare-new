// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/constants.ts
// ============================================

export const commonMedications = [
  { name: 'Lisinopril 10mg', category: 'Hypertension' },
  { name: 'Amlodipine 5mg', category: 'Hypertension' },
  { name: 'Metformin 500mg', category: 'Diabetes' },
  { name: 'Atorvastatin 20mg', category: 'Cholesterol' },
  { name: 'Losartan 50mg', category: 'Hypertension' },
  { name: 'Hydrochlorothiazide 25mg', category: 'Hypertension' },
  { name: 'Insulin Glargine', category: 'Diabetes' },
  { name: 'Aspirin 81mg', category: 'Cardiac' },
  { name: 'Clopidogrel 75mg', category: 'Cardiac' },
  { name: 'Metoprolol 25mg', category: 'Hypertension' },
  { name: 'Furosemide 40mg', category: 'Diuretic' },
  { name: 'Levothyroxine 50mcg', category: 'Thyroid' },
];

export const reminderTimes = ['08:00', '12:00', '18:00', '20:00'];

export const frequencyOptions = [
  { value: '', label: 'Select frequency' },
  { value: 'once daily', label: 'Once daily' },
  { value: 'twice daily', label: 'Twice daily' },
  { value: 'three times daily', label: 'Three times daily' },
  { value: 'four times daily', label: 'Four times daily' },
  { value: 'every other day', label: 'Every other day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as needed', label: 'As needed' },
  { value: 'with meals', label: 'With meals' },
  { value: 'at bedtime', label: 'At bedtime' },
];

export const severityOptions = {
  allergies: [
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
  ],
  sideEffects: [
    { value: 'common', label: 'Common' },
    { value: 'uncommon', label: 'Uncommon' },
    { value: 'rare', label: 'Rare' },
  ],
};