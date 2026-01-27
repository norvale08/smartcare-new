// FILE: app/caretaker/components/types/medication-types.ts

export interface PatientInfo {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface DoctorInfo {
  _id: string;
  fullName: string;
  specialization?: string;
}

export interface SideEffect {
  sideEffectName: string;
  reportedAt: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  intensity?: 'mild' | 'moderate' | 'severe' | 'very severe';
  resolved?: boolean;
  doctorNotes?: string;
  resolvedAt?: string;
  doctorId?: string;
  lastUpdated?: string;
}

export interface MedicationForForm {
  _id?: string;
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminders: string[];
  status?: 'active' | 'stopped' | 'completed' | 'cancelled' | 'inactive' | 'missed';
  startDate: string;
  patientId?: string;
  prescribedBy?: string;
  createdAt?: string;
  lastTaken?: string;
  adherence?: any;
  patientAllergies?: any[];
  potentialSideEffects?: any[];
  experiencedSideEffects?: any[];
  summary?: any;
}

export interface Medication {
  _id?: string;
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'stopped' | 'cancelled';
  startDate: string;
  patientId: string | PatientInfo;
  prescribedBy: string | DoctorInfo;
  createdAt: string;
  lastTaken?: string;
  adherence?: {
    currentStatus: 'taken' | 'missed' | 'stopped';
    reasonForStopping?: string;
    stoppedAt?: string;
    history?: Array<{
      date: string;
      status: string;
      reason?: string;
      notes?: string;
    }>;
  };
  patientAllergies?: Array<{
    allergyName: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
    notes?: string;
  }>;
  potentialSideEffects?: Array<{
    name: string;
    severity: 'common' | 'uncommon' | 'rare';
    description?: string;
  }>;
  experiencedSideEffects?: SideEffect[];
  summary?: {
    totalSideEffects: number;
    severeSideEffects: number;
    unresolvedSideEffects: number;
  };
}

export interface DoctorMedicationManagementProps {
  patient?: {
    id: string;
    fullName: string;
  };
  onMedicationSelect?: (medication: Medication) => void;
}

export interface SideEffectModalState {
  isOpen: boolean;
  sideEffect: null | (SideEffect & { medicationId: string; effectIndex: number; medicationName: string });
  patientName: string;
}

export interface MedicationStats {
  totalMedications: number;
  active: number;
  stopped: number;
  completed: number;
  totalSideEffects: number;
  severeSideEffects: number;
  unresolvedSideEffects: number;
}

export type ReportRow = {
  Patient: string;
  Medication: string;
  'Side Effect': string;
  Severity: 'mild' | 'moderate' | 'severe';
  Intensity: string;
  'Patient Notes': string;
  'Doctor Notes': string;
  Resolved: string;
  'Reported Date': string;
  'Last Updated': string;
};