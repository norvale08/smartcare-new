// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/types.ts
// ============================================

export interface MedicationPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onPrescribe: (prescription: any) => void;
}

export interface Allergy {
  allergyName: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes: string;
}

export interface SideEffect {
  name: string;
  severity: 'common' | 'uncommon' | 'rare';
  description: string;
}

export interface MedicationFormData {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  startDate: string;
  reminders: string[];
  patientAllergies: Allergy[];
  potentialSideEffects: SideEffect[];
  medicationImage?: string;
}

export interface PatientMedication {
  _id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'inactive' | 'completed';
  startDate?: string;
  patientAllergies?: Allergy[];
}

export interface MedicationFormProps {
  patient: any;
  existingMedications: PatientMedication[];
  loadingMedications: boolean;
  onRefreshMedications: () => void;
  onPrescribe: (formData: MedicationFormData) => Promise<void>;
  onCancel: () => void;
}