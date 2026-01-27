// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/types.ts
// UPDATED: Added editing medication support
// ============================================

export interface MedicationPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onPrescribe: (prescription: any) => void;
  editingMedication?: PatientMedication | null; // ⭐ ADDED
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
  endDate?: string | null;
  reminders: string[];
  patientAllergies: Allergy[];
  potentialSideEffects: SideEffect[];
  medicationImage?: string;
  medicationId?: string; // ⭐ ADDED: For edit mode
}

export interface PatientMedication {
  _id?: string; // ⭐ ADDED: Backend uses _id
  id?: string; // ⭐ ADDED: Frontend might use id
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string; // ⭐ ADDED
  instructions?: string; // ⭐ ADDED
  status: 'active' | 'inactive' | 'completed' | 'stopped' | 'cancelled'; // ⭐ EXPANDED
  startDate?: string;
  endDate?: string | null;
  reminders?: string[]; // ⭐ ADDED
  patientAllergies?: Allergy[];
  potentialSideEffects?: SideEffect[]; // ⭐ ADDED
  patientId?: string | any; // ⭐ ADDED
  prescribedBy?: string | any; // ⭐ ADDED
  createdAt?: string; // ⭐ ADDED
}

export interface MedicationFormProps {
  patient: any;
  existingMedications: PatientMedication[];
  loadingMedications: boolean;
  editingMedication?: PatientMedication | null;
  onRefreshMedications: () => void;
  onPrescribe: (formData: MedicationFormData) => Promise<void>;
  onCancel: () => void;
}